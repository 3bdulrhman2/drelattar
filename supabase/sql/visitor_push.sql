-- Visitor web push + staff broadcast (app 1.4.0).
-- visitor_push_devices: FCM web tokens from site visitors who allowed notifications. Server-only (RLS on, no client grants).
-- clinic_broadcasts: idempotency + audit of broadcasts sent from the app.
-- clinic_push_flags: visitor_live stays false until the owner approves real broadcasts to visitors.
-- Storage bucket clinic-broadcast: public-read images attached to broadcasts (max 1 MB, jpeg/png), written only by the edge function.
BEGIN;
CREATE TABLE IF NOT EXISTS public.visitor_push_devices(
  token text PRIMARY KEY CHECK (char_length(token) BETWEEN 100 AND 400),
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.visitor_push_devices ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.visitor_push_devices FROM anon, authenticated;
CREATE TABLE IF NOT EXISTS public.clinic_broadcasts(
  request_id uuid PRIMARY KEY, created_by uuid, audience text NOT NULL, dry_run boolean NOT NULL,
  title text, recipients integer, accepted integer, failed integer, created_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.clinic_broadcasts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.clinic_broadcasts FROM anon, authenticated;
CREATE TABLE IF NOT EXISTS public.clinic_push_flags(key text PRIMARY KEY, enabled boolean NOT NULL DEFAULT false);
ALTER TABLE public.clinic_push_flags ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.clinic_push_flags FROM anon, authenticated;
INSERT INTO public.clinic_push_flags(key,enabled) VALUES('visitor_live',false) ON CONFLICT (key) DO NOTHING;
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
  VALUES('clinic-broadcast','clinic-broadcast',true,1048576,ARRAY['image/jpeg','image/png']) ON CONFLICT (id) DO NOTHING;
COMMIT;
