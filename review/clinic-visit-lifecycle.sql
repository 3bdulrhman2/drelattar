BEGIN;
ALTER TABLE public.appointments DROP CONSTRAINT appointments_status_check;
ALTER TABLE public.appointments ADD CONSTRAINT appointments_visit_status_check CHECK(status IN ('pending','confirmed','arrived','in_consultation','completed','cancelled'));
CREATE OR REPLACE FUNCTION public.guard_clinic_visit_transition() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
BEGIN
 IF NEW.status IS NOT DISTINCT FROM OLD.status THEN RETURN NEW; END IF;
 IF (OLD.status='pending' AND NEW.status IN ('confirmed','cancelled')) OR (OLD.status='confirmed' AND NEW.status IN ('arrived','cancelled')) OR (OLD.status='arrived' AND NEW.status='in_consultation') OR (OLD.status='in_consultation' AND NEW.status='completed') THEN RETURN NEW; END IF;
 RAISE EXCEPTION 'Invalid clinic visit transition: % to %',OLD.status,NEW.status USING ERRCODE='23514';
END $$;
DROP TRIGGER IF EXISTS clinic_visit_transition ON public.appointments;
CREATE TRIGGER clinic_visit_transition BEFORE UPDATE OF status ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.guard_clinic_visit_transition();
COMMIT;
