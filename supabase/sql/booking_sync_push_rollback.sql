-- Rollback for booking sync push. Safe to run; bookings are unaffected.
drop trigger if exists clinic_booking_sync_push on public.appointments;
drop function if exists public.clinic_notify_booking_sync();
drop function if exists public.clinic_booking_sync_secret();
delete from vault.secrets where name = 'clinic_booking_sync_secret';
-- Then delete the edge function booking-sync-push in the dashboard.
