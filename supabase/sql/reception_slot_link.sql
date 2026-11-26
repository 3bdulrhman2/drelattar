-- Reception additions close website slots, and staff pushes fire on booking events.
-- 1. Walk-in entries can link to the appointment they reserved.
-- 2. Visit lifecycle allows cancelling from arrived/in_consultation (queue already allows it).
-- 3. add_clinic_walkin also reserves the next free website grid slot for today.
-- 4. set_clinic_walkin_status mirrors status onto the linked appointment (frees the slot on cancel).
-- 5. clinic_staff_push_notify + triggers: new website booking -> all staff devices,
--    patient entering consultation -> doctor (admin) devices with the patient name.
BEGIN;

ALTER TABLE public.clinic_reception_entries
  ADD COLUMN IF NOT EXISTS appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.guard_clinic_visit_transition() RETURNS trigger
LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
BEGIN
 IF NEW.status IS NOT DISTINCT FROM OLD.status THEN RETURN NEW; END IF;
 IF (OLD.status='pending' AND NEW.status IN ('confirmed','cancelled'))
  OR (OLD.status='confirmed' AND NEW.status IN ('arrived','cancelled'))
  OR (OLD.status='arrived' AND NEW.status IN ('in_consultation','cancelled'))
  OR (OLD.status='in_consultation' AND NEW.status IN ('completed','cancelled')) THEN RETURN NEW; END IF;
 RAISE EXCEPTION 'Invalid clinic visit transition: % to %',OLD.status,NEW.status USING ERRCODE='23514';
END $$;

CREATE OR REPLACE FUNCTION public.add_clinic_walkin(p_request_id uuid,p_name text)
RETURNS SETOF public.clinic_reception_entries LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE saved public.clinic_reception_entries%rowtype; today date:=(now() AT TIME ZONE 'Africa/Cairo')::date;
 s jsonb; step integer; is_friday boolean; start_at time; finish_at time; t time; cap integer;
 nowt time; appt_id uuid;
BEGIN
 IF NOT public.is_clinic_staff() THEN RAISE EXCEPTION 'Active staff required' USING ERRCODE='42501'; END IF;
 IF p_request_id IS NULL OR p_name IS NULL OR char_length(trim(p_name)) NOT BETWEEN 2 AND 120 THEN
  RAISE EXCEPTION 'Invalid input' USING ERRCODE='22023'; END IF;
 PERFORM pg_advisory_xact_lock(hashtext('clinic-reception:'||today::text));
 SELECT * INTO saved FROM public.clinic_reception_entries WHERE request_id=p_request_id;
 IF FOUND THEN
  IF saved.patient_name<>trim(p_name) OR saved.reception_date<>today THEN
   RAISE EXCEPTION 'Request mismatch' USING ERRCODE='22023'; END IF;
  RETURN NEXT saved; RETURN;
 END IF;
 INSERT INTO public.clinic_reception_entries(request_id,reception_date,patient_name,created_by)
  VALUES(p_request_id,today,trim(p_name),auth.uid()) RETURNING * INTO saved;
 -- Reserve the next free website slot for today so the site closes it (best effort: the
 -- queue entry stands even when no slot is free or the daily cap is reached).
 PERFORM pg_advisory_xact_lock(hashtext('clinic-booking:'||today::text));
 SELECT content->'bookingSettings' INTO s FROM public.clinic_settings WHERE key='main_settings';
 IF s IS NOT NULL AND coalesce((s->>'isEnabled')::boolean,false) THEN
  step:=coalesce((s->>'slotDurationMinutes')::integer,60);
  IF step=ANY(ARRAY[15,30,45,60]) THEN
   is_friday:=extract(isodow FROM today)=5;
   start_at:=coalesce(s->>CASE WHEN is_friday THEN 'startTimeFriday' ELSE 'startTime' END,CASE WHEN is_friday THEN '16:00' ELSE '13:00' END)::time;
   finish_at:=coalesce(s->>CASE WHEN is_friday THEN 'endTimeFriday' ELSE 'endTime' END,CASE WHEN is_friday THEN '22:00' ELSE '21:00' END)::time;
   cap:=greatest(coalesce((s->>'maxDailyBookings')::integer,25),1);
   IF (SELECT count(*) FROM public.appointments WHERE appointment_date=today AND status<>'cancelled')<cap THEN
    nowt:=(now() AT TIME ZONE 'Africa/Cairo')::time;
    t:=start_at;
    WHILE t<finish_at LOOP
     IF t>=nowt AND NOT EXISTS(SELECT 1 FROM public.appointments a
        WHERE a.appointment_date=today AND a.appointment_time=to_char(t,'HH24:MI') AND a.status<>'cancelled') THEN
      PERFORM set_config('clinic.from_reception','1',true);
      INSERT INTO public.appointments(patient_name,patient_phone,appointment_date,appointment_time,status,notes)
       VALUES(trim(p_name),'',today,to_char(t,'HH24:MI'),'confirmed','حجز من استقبال العيادة') RETURNING id INTO appt_id;
      UPDATE public.clinic_reception_entries SET appointment_id=appt_id,updated_at=now() WHERE id=saved.id
       RETURNING * INTO saved;
      EXIT;
     END IF;
     t:=t+(step||' minutes')::interval;
    END LOOP;
   END IF;
  END IF;
 END IF;
 RETURN NEXT saved; RETURN;
END $$;

CREATE OR REPLACE FUNCTION public.set_clinic_walkin_status(p_id uuid,p_status text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE old public.clinic_reception_entries%rowtype; today date:=(now() AT TIME ZONE 'Africa/Cairo')::date;
BEGIN
 IF NOT public.is_clinic_staff() THEN RAISE EXCEPTION 'Active staff required' USING ERRCODE='42501'; END IF;
 IF p_status IS NULL OR p_status NOT IN ('in_consultation','completed','cancelled') THEN
  RAISE EXCEPTION 'Invalid status' USING ERRCODE='22023'; END IF;
 SELECT * INTO old FROM public.clinic_reception_entries WHERE id=p_id AND reception_date=today FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Not found' USING ERRCODE='22023'; END IF;
 IF old.status=p_status THEN RETURN true; END IF;
 IF NOT ((old.status='waiting' AND p_status IN ('in_consultation','cancelled'))
  OR (old.status='in_consultation' AND p_status IN ('completed','cancelled'))) THEN
  RAISE EXCEPTION 'Invalid transition' USING ERRCODE='22023'; END IF;
 UPDATE public.clinic_reception_entries SET status=p_status,
  started_at=CASE WHEN p_status='in_consultation' THEN now() ELSE started_at END,updated_at=now() WHERE id=p_id;
 INSERT INTO public.clinic_reception_audit(entry_id,actor_id,previous_status,next_status)
  VALUES(p_id,auth.uid(),old.status,p_status);
 -- Mirror onto the linked appointment so the website slot follows the visit (cancel frees it).
 IF old.appointment_id IS NOT NULL THEN
  IF p_status='in_consultation' THEN
   UPDATE public.appointments SET status='arrived' WHERE id=old.appointment_id AND status='confirmed';
   UPDATE public.appointments SET status='in_consultation' WHERE id=old.appointment_id AND status='arrived';
  ELSIF p_status='completed' THEN
   UPDATE public.appointments SET status='completed' WHERE id=old.appointment_id AND status='in_consultation';
  ELSIF p_status='cancelled' THEN
   UPDATE public.appointments SET status='cancelled' WHERE id=old.appointment_id AND status IN ('confirmed','arrived','in_consultation');
  END IF;
 END IF;
 RETURN true;
END $$;

CREATE OR REPLACE FUNCTION public.clinic_staff_push_notify() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE s text; payload jsonb;
BEGIN
 IF TG_TABLE_NAME='appointments' AND TG_OP='INSERT' THEN
  IF current_setting('clinic.from_reception',true)='1' THEN RETURN NULL; END IF;
  payload:=jsonb_build_object('kind','new_booking','name',NEW.patient_name,'date',NEW.appointment_date,'time',NEW.appointment_time);
 ELSIF TG_TABLE_NAME='appointments' THEN
  IF NEW.status<>'in_consultation' OR OLD.status='in_consultation' THEN RETURN NULL; END IF;
  payload:=jsonb_build_object('kind','patient_entering','name',NEW.patient_name,'date',NEW.appointment_date,'time',NEW.appointment_time);
 ELSE
  IF NEW.status<>'in_consultation' OR OLD.status='in_consultation' OR NEW.appointment_id IS NOT NULL THEN RETURN NULL; END IF;
  payload:=jsonb_build_object('kind','patient_entering','name',NEW.patient_name);
 END IF;
 BEGIN
  SELECT decrypted_secret INTO s FROM vault.decrypted_secrets WHERE name='clinic_booking_sync_secret' LIMIT 1;
  IF s IS NOT NULL THEN
   PERFORM net.http_post(url:='https://jpamutyomblwobwntoky.supabase.co/functions/v1/clinic-staff-notify',
    headers:=jsonb_build_object('Content-Type','application/json','x-sync-secret',s),
    body:=payload, timeout_milliseconds:=3000);
  END IF;
 EXCEPTION WHEN OTHERS THEN NULL;
 END;
 RETURN NULL;
END $$;
REVOKE ALL ON FUNCTION public.clinic_staff_push_notify() FROM PUBLIC,anon,authenticated;

DROP TRIGGER IF EXISTS clinic_push_new_booking ON public.appointments;
CREATE TRIGGER clinic_push_new_booking AFTER INSERT ON public.appointments
 FOR EACH ROW EXECUTE FUNCTION public.clinic_staff_push_notify();
DROP TRIGGER IF EXISTS clinic_push_entering ON public.appointments;
CREATE TRIGGER clinic_push_entering AFTER UPDATE OF status ON public.appointments
 FOR EACH ROW EXECUTE FUNCTION public.clinic_staff_push_notify();
DROP TRIGGER IF EXISTS clinic_push_walkin_entering ON public.clinic_reception_entries;
CREATE TRIGGER clinic_push_walkin_entering AFTER UPDATE OF status ON public.clinic_reception_entries
 FOR EACH ROW EXECUTE FUNCTION public.clinic_staff_push_notify();
COMMIT;
