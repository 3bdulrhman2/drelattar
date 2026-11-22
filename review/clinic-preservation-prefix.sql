-- REVIEW ONLY. Prefix for one atomic security migration on an existing clinic.
-- Requires an independently exported and restore-verified checksum supplied by
-- the operator through clinic_repair.expected_checksum. No real values live here.
BEGIN;
LOCK TABLE public.appointments,public.clinic_settings IN SHARE ROW EXCLUSIVE MODE;
CREATE SCHEMA IF NOT EXISTS clinic_repair_private;
REVOKE ALL ON SCHEMA clinic_repair_private FROM PUBLIC,anon,authenticated;
CREATE TABLE IF NOT EXISTS clinic_repair_private.checkpoints(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),created_at timestamptz NOT NULL DEFAULT now(),
 snapshot jsonb NOT NULL,source_checksum text NOT NULL
);
ALTER TABLE clinic_repair_private.checkpoints ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON clinic_repair_private.checkpoints FROM PUBLIC,anon,authenticated;
DO $$ DECLARE original jsonb; expected text;
BEGIN
 expected:=current_setting('clinic_repair.expected_checksum',true);
 SELECT jsonb_build_object(
 'appointments',(SELECT jsonb_agg(to_jsonb(a) ORDER BY id) FROM public.appointments a),
 'clinic_settings',(SELECT jsonb_agg(to_jsonb(c) ORDER BY id) FROM public.clinic_settings c)) INTO original;
 IF expected IS NULL OR length(expected)<>32 OR md5(original::text)<>expected
 THEN RAISE EXCEPTION 'Verified export is absent or stale; no repair was applied'; END IF;
 IF EXISTS(SELECT 1 FROM public.clinic_settings WHERE coalesce((content->'bookingSettings'->>'isEnabled')::boolean,true))
 THEN RAISE EXCEPTION 'This rollout requires public intake to remain disabled'; END IF;
 INSERT INTO clinic_repair_private.checkpoints(snapshot,source_checksum) VALUES(original,expected);
 IF NOT EXISTS(SELECT 1 FROM clinic_repair_private.checkpoints WHERE source_checksum=expected AND md5(snapshot::text)=expected)
 THEN RAISE EXCEPTION 'Protected checkpoint verification failed'; END IF;
END $$;
-- Keep the complete original document in the protected checkpoint. Only its
-- publicly exposed copy loses the private arrays. Appointment rows are unchanged.
UPDATE public.clinic_settings SET content=content-'bookings'-'secretaryAccounts'-'deviceTokens';
