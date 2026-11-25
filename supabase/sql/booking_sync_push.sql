-- Booking sync push (data-only wake-up to the doctor's devices). Applied manually in the Supabase SQL editor.
-- NOTE: the vault.create_secret line was run once; do not re-run (it would create a duplicate secret).
select vault.create_secret(encode(extensions.gen_random_bytes(24),'hex'),'clinic_booking_sync_secret','Shared secret for booking-sync-push');
create or replace function public.clinic_booking_sync_secret() returns text language sql security definer set search_path='' as $f$ select decrypted_secret from vault.decrypted_secrets where name='clinic_booking_sync_secret' limit 1 $f$;
revoke all on function public.clinic_booking_sync_secret() from public, anon, authenticated;
grant execute on function public.clinic_booking_sync_secret() to service_role;
create or replace function public.clinic_notify_booking_sync() returns trigger language plpgsql security definer set search_path='' as $f$
declare s text;
begin
  begin
    select decrypted_secret into s from vault.decrypted_secrets where name='clinic_booking_sync_secret' limit 1;
    if s is not null then
      perform net.http_post(url:='https://jpamutyomblwobwntoky.supabase.co/functions/v1/booking-sync-push', headers:=jsonb_build_object('Content-Type','application/json','x-sync-secret',s), body:='{}'::jsonb, timeout_milliseconds:=3000);
    end if;
  exception when others then null;
  end;
  return null;
end $f$;
revoke all on function public.clinic_notify_booking_sync() from public, anon, authenticated;
create trigger clinic_booking_sync_push after insert or update or delete on public.appointments for each statement execute function public.clinic_notify_booking_sync();
