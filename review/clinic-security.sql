-- Migration template. Validate the target and preserve existing data before use.
-- Apply only with a verified backup, private-array/duplicate-slot review,
-- protected staff provisioning and a decision for any incompatible old clients.
BEGIN;
CREATE TABLE IF NOT EXISTS public.clinic_settings (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), key text UNIQUE NOT NULL,
 content jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.appointments (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), patient_name text NOT NULL,
 patient_phone text NOT NULL, appointment_date date NOT NULL,
 appointment_time text NOT NULL, notes text, status text NOT NULL DEFAULT 'pending'
 CHECK (status IN ('pending','confirmed','cancelled','completed')),
 created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS request_id uuid;
CREATE UNIQUE INDEX IF NOT EXISTS appointments_request_id_unique ON public.appointments(request_id) WHERE request_id IS NOT NULL;
-- Legacy times must be normalized through a reviewed migration, not silently cast.
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM public.appointments WHERE appointment_time !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$')
 THEN RAISE EXCEPTION 'Legacy appointment times require reviewed normalization'; END IF;
END $$;
-- Preserve existing active-slot conflicts exactly. Serialize every newly occupied
-- slot, including staff reactivation, instead of requiring old rows to be removed.
CREATE INDEX IF NOT EXISTS appointments_active_slot_lookup
 ON public.appointments(appointment_date,appointment_time) WHERE status <> 'cancelled';
CREATE OR REPLACE FUNCTION public.guard_new_clinic_slot()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
 IF NEW.status='cancelled' THEN RETURN NEW; END IF;
 IF TG_OP='UPDATE' AND OLD.status<>'cancelled'
   AND OLD.appointment_date=NEW.appointment_date AND OLD.appointment_time=NEW.appointment_time
 THEN RETURN NEW; END IF;
 PERFORM pg_advisory_xact_lock(hashtext('clinic-booking:'||NEW.appointment_date::text));
 IF EXISTS(SELECT 1 FROM public.appointments a WHERE a.appointment_date=NEW.appointment_date
  AND a.appointment_time=NEW.appointment_time AND a.status<>'cancelled' AND a.id<>NEW.id)
 THEN RAISE EXCEPTION 'Appointment slot already occupied' USING ERRCODE='23505'; END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.guard_new_clinic_slot() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS clinic_new_slot_guard ON public.appointments;
CREATE TRIGGER clinic_new_slot_guard BEFORE INSERT OR UPDATE OF status,appointment_date,appointment_time
 ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.guard_new_clinic_slot();
CREATE TABLE IF NOT EXISTS public.clinic_staff (
 user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 role text NOT NULL CHECK (role IN ('admin','secretary')), name text NOT NULL,
 is_active boolean NOT NULL DEFAULT false
);
-- Realtime carries a patient-free revision signal, never appointment rows or IDs.
CREATE TABLE IF NOT EXISTS public.clinic_booking_sync (
 id boolean PRIMARY KEY DEFAULT true CHECK(id), revision bigint NOT NULL DEFAULT 0,
 changed_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.clinic_booking_sync(id) VALUES(true) ON CONFLICT(id) DO NOTHING;
CREATE OR REPLACE FUNCTION public.bump_clinic_booking_sync()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
 UPDATE public.clinic_booking_sync SET revision=revision+1,changed_at=clock_timestamp() WHERE id=true;
 RETURN NULL;
END $$;
REVOKE ALL ON FUNCTION public.bump_clinic_booking_sync() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS clinic_booking_sync_changed ON public.appointments;
CREATE TRIGGER clinic_booking_sync_changed AFTER INSERT OR UPDATE OR DELETE ON public.appointments
 FOR EACH ROW EXECUTE FUNCTION public.bump_clinic_booking_sync();
CREATE OR REPLACE FUNCTION public.is_clinic_staff(admin_only boolean DEFAULT false)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 SELECT EXISTS (SELECT 1 FROM public.clinic_staff WHERE user_id=auth.uid() AND is_active
   AND (NOT admin_only OR role='admin'))
$$;
REVOKE ALL ON FUNCTION public.is_clinic_staff(boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_clinic_staff(boolean) TO authenticated;
-- Public settings are an allowlist, never a mixed public/private application state.
CREATE OR REPLACE FUNCTION public.only_public_clinic_content(value jsonb)
RETURNS jsonb LANGUAGE sql IMMUTABLE SET search_path=pg_catalog AS $$
 SELECT coalesce(jsonb_object_agg(key,val),'{}'::jsonb)
 FROM jsonb_each(value) e(key,val)
 WHERE key=ANY(ARRAY['doctor','clinic','services','equipment','faq','social','bookingSettings',
 'visibility','googlePlacesApiKey','googlePlaceId','socialReviewImages'])
$$;
-- Never silently discard legacy private arrays. A separate reviewed migration must
-- reconcile them into protected stores first. This check intentionally stops rollout.
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM public.clinic_settings WHERE
   jsonb_array_length(coalesce(content->'bookings','[]'::jsonb))>0 OR
   jsonb_array_length(coalesce(content->'secretaryAccounts','[]'::jsonb))>0 OR
   jsonb_array_length(coalesce(content->'deviceTokens','[]'::jsonb))>0)
 THEN RAISE EXCEPTION 'Legacy private arrays require controlled migration; no data was discarded'; END IF;
END $$;
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM public.clinic_settings s CROSS JOIN LATERAL jsonb_object_keys(s.content) k
 WHERE k<>ALL(ARRAY['doctor','clinic','services','equipment','faq','social','bookingSettings',
 'visibility','googlePlacesApiKey','googlePlaceId','socialReviewImages','bookings','secretaryAccounts','deviceTokens']))
 THEN RAISE EXCEPTION 'Unrecognized settings keys require review before migration'; END IF;
END $$;
UPDATE public.clinic_settings SET content=public.only_public_clinic_content(content);
ALTER TABLE public.clinic_settings DROP CONSTRAINT IF EXISTS clinic_settings_public_content_only;
ALTER TABLE public.clinic_settings ADD CONSTRAINT clinic_settings_public_content_only
 CHECK (content=public.only_public_clinic_content(content));
-- Remove permissive policies on these specific clinic tables, including unknown old names.
DO $$ DECLARE p record; BEGIN
 FOR p IN SELECT schemaname,tablename,policyname FROM pg_policies
 WHERE schemaname='public' AND tablename IN ('appointments','clinic_settings','clinic_staff','clinic_booking_sync')
 LOOP EXECUTE format('DROP POLICY %I ON %I.%I',p.policyname,p.schemaname,p.tablename); END LOOP;
END $$;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_booking_sync ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.appointments,public.clinic_settings,public.clinic_staff,public.clinic_booking_sync FROM PUBLIC,anon,authenticated;
GRANT USAGE ON SCHEMA public TO anon,authenticated;
GRANT SELECT ON public.clinic_settings TO anon,authenticated;
GRANT UPDATE(content,updated_at) ON public.clinic_settings TO authenticated;
GRANT SELECT ON public.clinic_staff,public.clinic_booking_sync TO authenticated;
GRANT SELECT ON public.appointments TO authenticated;
GRANT UPDATE(status) ON public.appointments TO authenticated;
GRANT DELETE ON public.appointments TO authenticated;
CREATE POLICY clinic_public_settings ON public.clinic_settings FOR SELECT TO anon,authenticated USING(key='main_settings');
CREATE POLICY clinic_admin_settings ON public.clinic_settings FOR UPDATE TO authenticated
 USING(key='main_settings' AND public.is_clinic_staff(true)) WITH CHECK(key='main_settings' AND public.is_clinic_staff(true));
CREATE POLICY clinic_own_membership ON public.clinic_staff FOR SELECT TO authenticated USING(user_id=auth.uid() AND is_active);
CREATE POLICY clinic_staff_sync ON public.clinic_booking_sync FOR SELECT TO authenticated USING(public.is_clinic_staff());
CREATE POLICY clinic_staff_bookings ON public.appointments FOR SELECT TO authenticated USING(public.is_clinic_staff());
CREATE POLICY clinic_staff_status ON public.appointments FOR UPDATE TO authenticated USING(public.is_clinic_staff()) WITH CHECK(public.is_clinic_staff());
CREATE POLICY clinic_admin_delete ON public.appointments FOR DELETE TO authenticated USING(public.is_clinic_staff(true));
CREATE OR REPLACE FUNCTION public.get_booked_slots(p_date date)
RETURNS TABLE(appointment_time text) LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 SELECT a.appointment_time FROM public.appointments a
 WHERE a.appointment_date=p_date AND a.status<>'cancelled'
 AND p_date BETWEEN (now() AT TIME ZONE 'Africa/Cairo')::date AND (now() AT TIME ZONE 'Africa/Cairo')::date +
 greatest(coalesce((SELECT (content->'bookingSettings'->>'maxAdvanceDays')::integer FROM public.clinic_settings WHERE key='main_settings'),14),1)
$$;
REVOKE ALL ON FUNCTION public.get_booked_slots(date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_booked_slots(date) TO anon,authenticated;
CREATE OR REPLACE FUNCTION public.book_appointment(p_request_id uuid,p_patient_name text,p_patient_phone text,p_date date,p_time text)
RETURNS TABLE(booking_id uuid,created_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE s jsonb; old public.appointments%ROWTYPE; saved public.appointments%ROWTYPE;
 today date:=(now() AT TIME ZONE 'Africa/Cairo')::date; start_at time; finish_at time;
 step integer; minute_offset integer; is_friday boolean; max_days integer; daily_cap integer;
BEGIN
 IF p_request_id IS NULL OR char_length(trim(p_patient_name)) NOT BETWEEN 2 AND 120
 OR p_patient_phone !~ '^(\+20|0020|0)?1[0125][0-9]{8}$'
 OR p_time !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' THEN
  RAISE EXCEPTION 'Invalid booking input' USING ERRCODE='22023'; END IF;
 -- Serialize date capacity; the slot trigger also protects other write paths.
 PERFORM pg_advisory_xact_lock(hashtext('clinic-booking:'||p_date::text));
 SELECT * INTO old FROM public.appointments a WHERE a.request_id=p_request_id;
 IF FOUND THEN
  IF old.patient_name<>trim(p_patient_name) OR old.patient_phone<>trim(p_patient_phone)
    OR old.appointment_date<>p_date OR old.appointment_time<>p_time THEN
   RAISE EXCEPTION 'Request ID reused with different details' USING ERRCODE='22023'; END IF;
  RETURN QUERY SELECT old.id,old.created_at; RETURN;
 END IF;
 SELECT content->'bookingSettings' INTO s FROM public.clinic_settings WHERE key='main_settings';
 IF s IS NULL OR NOT coalesce((s->>'isEnabled')::boolean,false) THEN RAISE EXCEPTION 'Booking closed' USING ERRCODE='22023'; END IF;
 max_days:=greatest(coalesce((s->>'maxAdvanceDays')::integer,14),1);
 IF p_date<today OR p_date>today+max_days OR
 (p_date+p_time::time) AT TIME ZONE 'Africa/Cairo' < now()+interval '3 hours' THEN
 RAISE EXCEPTION 'Outside booking window' USING ERRCODE='22023'; END IF;
 IF NOT coalesce(s->'allowedDays','[]'::jsonb) ? trim(to_char(p_date,'Day'))
 OR (p_date=today AND coalesce((s->>'isClosedToday')::boolean,false))
 OR coalesce(s->'closedDates','[]'::jsonb) ? p_date::text
 OR EXISTS(SELECT 1 FROM jsonb_array_elements(coalesce(s->'holidays','[]'::jsonb)) h
 WHERE coalesce((h->>'isActive')::boolean,false) AND p_date BETWEEN (h->>'startDate')::date AND (h->>'endDate')::date)
 THEN RAISE EXCEPTION 'Clinic closed on this date' USING ERRCODE='22023'; END IF;
 is_friday:=extract(isodow FROM p_date)=5;
 start_at:=coalesce(s->>CASE WHEN is_friday THEN 'startTimeFriday' ELSE 'startTime' END,CASE WHEN is_friday THEN '16:00' ELSE '13:00' END)::time;
 finish_at:=coalesce(s->>CASE WHEN is_friday THEN 'endTimeFriday' ELSE 'endTime' END,CASE WHEN is_friday THEN '22:00' ELSE '21:00' END)::time;
 step:=coalesce((s->>'slotDurationMinutes')::integer,60);
 IF step NOT IN (15,30,45,60) THEN RAISE EXCEPTION 'Invalid interval' USING ERRCODE='22023'; END IF;
 minute_offset:=extract(epoch FROM (p_time::time-start_at))::integer/60;
 IF p_time::time<start_at OR p_time::time>=finish_at OR minute_offset%step<>0 THEN
 RAISE EXCEPTION 'Invalid appointment time' USING ERRCODE='22023'; END IF;
 daily_cap:=greatest(coalesce((s->>'maxDailyBookings')::integer,25),1);
 IF (SELECT count(*) FROM public.appointments WHERE appointment_date=p_date AND status<>'cancelled')>=daily_cap THEN
 RAISE EXCEPTION 'Daily capacity reached' USING ERRCODE='23505'; END IF;
 INSERT INTO public.appointments(request_id,patient_name,patient_phone,appointment_date,appointment_time,status)
 VALUES(p_request_id,trim(p_patient_name),trim(p_patient_phone),p_date,p_time,'pending') RETURNING * INTO saved;
 RETURN QUERY SELECT saved.id,saved.created_at;
END $$;
REVOKE ALL ON FUNCTION public.book_appointment(uuid,text,text,date,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.book_appointment(uuid,text,text,date,text) TO anon,authenticated;
-- Direct appointment DELETE notifications may expose primary keys despite RLS.
-- Only the constant-key, patient-free sync row may be published for booking refresh.
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM pg_publication WHERE pubname='supabase_realtime' AND puballtables)
 THEN RAISE EXCEPTION 'All-table Realtime publication requires a separate reviewed isolation plan'; END IF;
 IF EXISTS(SELECT 1 FROM pg_publication WHERE pubname='supabase_realtime') THEN
  IF EXISTS(SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='appointments')
  THEN ALTER PUBLICATION supabase_realtime DROP TABLE public.appointments; END IF;
  IF NOT EXISTS(SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='clinic_settings')
  THEN ALTER PUBLICATION supabase_realtime ADD TABLE public.clinic_settings; END IF;
  IF NOT EXISTS(SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='clinic_booking_sync')
  THEN ALTER PUBLICATION supabase_realtime ADD TABLE public.clinic_booking_sync; END IF;
 END IF;
END $$;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon,authenticated;
-- Do not recreate the old broad default privileges for anonymous users.
-- Public intake needs a reviewed rate limit/CAPTCHA strategy before live enabling.
COMMIT;
