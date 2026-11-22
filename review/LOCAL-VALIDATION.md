# Actual local Supabase validation

This is a disposable local test, not a hosted staging project and not production approval. It was run with CLI 3.2.0, native PostgreSQL 17, actual Auth, PostgREST and Realtime. No Supabase login/link, clinic data, SMTP, emails, Firebase, tunnels or cloud account changes were used.

## Important repair discovered by the real test

Direct Postgres Changes on `appointments` exposed a deleted booking's primary key to an authenticated non-staff subscriber even though ordinary patient reads and INSERT events were protected by RLS. No names or phone numbers were disclosed to that subscriber in the test.

The revised proposal removes `appointments` from the `supabase_realtime` publication and publishes only `clinic_booking_sync`: a constant boolean key, revision counter and timestamp. Authorized staff receive that patient-free signal and reload private bookings through RLS. A real DELETE regression test now verifies no receipt ID or patient row reaches unauthorized subscribers. The migration refuses an all-tables publication rather than silently changing an unknown publication design.

Anonymous subscribers to the protected signal can receive empty Unauthorized event envelopes from Realtime. These contain no row fields. Do not describe this as no network traffic at all. Rate limiting and public-channel hardening remain part of staging/abuse review.

The actual browser test also caught a login UX issue: an Auth callback temporarily unmounted the login form, losing the non-staff denial message. The login form now stays mounted while authentication resolves. A real non-staff login is rejected without fetching patients.

## Reproduce only in a clean isolated checkout

Use a separate temporary directory for the local stack, a separate `SUPABASE_HOME`, and only the supplied local configuration. Do not run `supabase login`, `link`, `db pull`, `db push`, cloud configuration commands, or GitHub/Vercel integrations. Do not use real environment files or addresses. The native runtime is experimental, and its interface can change, so pin the checked CLI version.

1. Put `review/local-supabase.config.toml` at `supabase/config.toml` inside the new temporary stack directory.
2. Set `SUPABASE_HOME` to a new private temporary state directory and run the pinned CLI's `start --runtime native --exclude functions,storage,studio,analytics,pooler,mail --preparation on-demand --eager` there. Verify all listeners remain on `127.0.0.1` before using the stack. The checked native runtime binds there; do not substitute a hosted URL or external tunnel.
3. Save `status --output-format json` to a private file outside the source package. It contains disposable local keys. Never upload or share that file.
4. From the clean clinic checkout, set `CLINIC_NATIVE_STATUS` to that absolute status-file path and run `npm run test:native`. For the browser test, also set `CLINIC_NATIVE_BROWSER_FIXTURE` to a private temporary filename. This file contains only generated synthetic login credentials and must not be uploaded or included in source artifacts.
5. Run `npm run build:native-test`, then `npm run test:native-browser`, with those same environment variables. The build helper rejects real environment files and uses only the local publishable key, never the secret key.
6. Stop and destroy only this disposable stack after validation. Delete its synthetic fixture/status files. Keep downloaded runtime binaries out of deliverables.

The integration fixture expects an empty database. An optional `CLINIC_NATIVE_RESET=1` resets only its existing synthetic tables after checking the fixed fictional patient marker; do not use this flag with any other local data. The SQL migration in the package remains review-only for live systems.

## Completed checks

- 17 actual local API/database/Realtime checks, including real Auth membership, rejected anonymous/outsider access, saved UUID/idempotency, simultaneous same-slot and daily-capacity requests, real staff change signaling, membership revocation, refresh-token revocation on global logout, public times-only availability and the DELETE privacy regression.
- Eight actual-browser Auth/sync checks: authorized admin entry, no session restoration after reload, logout clearing protected content valid-but-non-staff rejection without patient retrieval, and actual admin content/hours/gap edits reaching already-open public pages without refresh. Test hours and gap are restored through the UI, and no booking is submitted.
- Separately: 21 embedded PostgreSQL checks, six helper checks and five mock-browser checks for uncertain/lost response and safe retry behavior.

The automated test fixtures and Auth accounts were fictional. Private preservation verification is a separate operational step and is never included in repository artifacts. A successful local test does not verify hosted settings, production migration history, real user provisioning, token-expiry timing, actual mobile operation, push/WhatsApp delivery, rate limits or daily reports. Mobile compatibility and live rollout remain gated. JWT logout prevents refresh and clears the client; server-owned membership revocation is the tested immediate access check for an otherwise valid JWT. Do not promise that logout retroactively erases information someone already saw.

## Source references

https://supabase.com/docs/guides/local-development/docker-and-native-runtimes
https://supabase.com/docs/guides/local-development/cli/getting-started
https://supabase.com/docs/guides/local-development/cli-workflows
https://supabase.com/docs/guides/local-development/running-multiple-local-projects

## Preserving existing data

Eight additional embedded-PostgreSQL checks cover a stale/missing-export refusal, an exact original-document checkpoint, preservation of conflicting appointments and clinical fields, denial of API-role checkpoint access, prevention of new conflicts and reactivation conflicts, and status changes to grandfathered rows. No old conflicting row is removed to make an index fit.

The UI test uses mutation-based assertions on background pages. Animation-frame polling can pause in a hidden tab and produce a false timeout even after its DOM has updated. A cold local Realtime run missed the first signal; warmed runs passed, and the client performs a bounded catch-up read after channel subscription, not continuous polling. Network outages can still delay updates.
