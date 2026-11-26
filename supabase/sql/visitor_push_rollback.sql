-- Rollback for visitor_push.sql. Also revert the website commit and redeploy the previous app.
-- The storage bucket clinic-broadcast must be emptied and deleted from Dashboard > Storage (SQL deletes on storage tables are blocked).
BEGIN;
DROP TABLE IF EXISTS public.visitor_push_devices;
DROP TABLE IF EXISTS public.clinic_broadcasts;
DROP TABLE IF EXISTS public.clinic_push_flags;
COMMIT;
