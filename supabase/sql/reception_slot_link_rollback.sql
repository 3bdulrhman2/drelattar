-- Roll back reception_slot_link.sql: push triggers, notify function, walk-in slot
-- reservation and status mirroring, and the visit-lifecycle cancellation extension.
-- Existing linked appointment rows stay in history; the link column is dropped.
BEGIN;
DROP TRIGGER IF EXISTS clinic_push_new_booking ON public.appointments;
DROP TRIGGER IF EXISTS clinic_push_entering ON public.appointments;
DROP TRIGGER IF EXISTS clinic_push_walkin_entering ON public.clinic_reception_entries;
DROP FUNCTION IF EXISTS public.clinic_staff_push_notify();

-- Restore the original visit transition guard (no cancel from arrived/in_consultation).
CREATE OR REPLACE FUNCTION public.guard_clinic_visit_transition() RETURNS trigger
LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
BEGIN
 IF NEW.status IS NOT DISTINCT FROM OLD.status THEN RETURN NEW; END IF;
 IF (OLD.status='pending' AND NEW.status IN ('confirmed','cancelled')) OR (OLD.status='confirmed' AND NEW.status IN ('arrived','cancelled')) OR (OLD.status='arrived' AND NEW.status='in_consultation') OR (OLD.status='in_consultation' AND NEW.status='completed') THEN RETURN NEW; END IF;
 RAISE EXCEPTION 'Invalid clinic visit transition: % to %',OLD.status,NEW.status USING ERRCODE='23514';
END $$;

-- Restore the original add_clinic_walkin (queue only, no slot reservation).
CREATE OR REPLACE FUNCTION public.add_clinic_walkin(p_request_id uuid,p_name text)
RETURNS SETOF public.clinic_reception_entries LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE saved public.clinic_reception_entries%rowtype; today date:=(now() AT TIME ZONE 'Africa/Cairo')::date;
BEGIN
 IF NOT public.is_clinic_staff() THEN RAISE EXCEPTION 'Active staff required' USING ERRCODE='42501'; END IF;
 IF p_request_id IS NULL OR p_name IS NULL OR char_length(trim(p_name)) NOT BETWEEN 2 AND 120 THEN RAISE EXCEPTION 'Invalid input' USING ERRCODE='22023'; END IF;
 PERFORM pg_advisory_xact_lock(hashtext('clinic-reception:'||today::text));
 SELECT * INTO saved FROM public.clinic_reception_entries WHERE request_id=p_request_id;
 IF FOUND THEN
  IF saved.patient_name<>trim(p_name) OR saved.reception_date<>today THEN RAISE EXCEPTION 'Request mismatch' USING ERRCODE='22023'; END IF;
  RETURN NEXT saved; RETURN;
 END IF;
 INSERT INTO public.clinic_reception_entries(request_id,reception_date,patient_name,created_by) VALUES(p_request_id,today,trim(p_name),auth.uid()) RETURNING * INTO saved;
 RETURN NEXT saved; RETURN;
END $$;

-- Restore the original set_clinic_walkin_status (no appointment mirroring).
CREATE OR REPLACE FUNCTION public.set_clinic_walkin_status(p_id uuid,p_status text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE old public.clinic_reception_entries%rowtype; today date:=(now() AT TIME ZONE 'Africa/Cairo')::date;
BEGIN
 IF NOT public.is_clinic_staff() THEN RAISE EXCEPTION 'Active staff required' USING ERRCODE='42501'; END IF;
 IF p_status IS NULL OR p_status NOT IN ('in_consultation','completed','cancelled') THEN RAISE EXCEPTION 'Invalid status' USING ERRCODE='22023'; END IF;
 SELECT * INTO old FROM public.clinic_reception_entries WHERE id=p_id AND reception_date=today FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Not found' USING ERRCODE='22023'; END IF;
 IF old.status=p_status THEN RETURN true; END IF;
 IF NOT ((old.status='waiting' AND p_status IN ('in_consultation','cancelled')) OR (old.status='in_consultation' AND p_status IN ('completed','cancelled'))) THEN RAISE EXCEPTION 'Invalid transition' USING ERRCODE='22023'; END IF;
 UPDATE public.clinic_reception_entries SET status=p_status,started_at=CASE WHEN p_status='in_consultation' THEN now() ELSE started_at END,updated_at=now() WHERE id=p_id;
 INSERT INTO public.clinic_reception_audit(entry_id,actor_id,previous_status,next_status) VALUES(p_id,auth.uid(),old.status,p_status);
 RETURN true;
END $$;

ALTER TABLE public.clinic_reception_entries DROP COLUMN IF EXISTS appointment_id;
COMMIT;
