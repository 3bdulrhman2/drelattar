# Clinic website

React and TypeScript clinic website with protected staff access and public clinic information.

## Security and persistence

- Staff sign in through Supabase Auth. An active, server-owned `clinic_staff` membership determines access. Browser storage and frontend passwords never grant a role.
- Public settings contain an allowlist of website information, not patient records, staff credentials or device tokens.
- Patient rows are protected by RLS and are not published directly through Realtime. Authorized staff receive a patient-free change signal and reload protected rows.
- Sanitized website settings are published for live content updates. Writes are serialized, and save indicators require a database acknowledgement. Reconnect and visibility checks recover missed updates without continuous polling.
- Public booking, when separately enabled, waits for a stored server receipt. Retries on the same page use the same request ID. Clinical notes are not part of public intake.
- Existing conflicting appointments can be preserved. A database trigger serializes new slot occupation and prevents new conflicts, including reactivation into an occupied slot.

## Configuration

Copy `.env.example` and supply the public Supabase/Firebase configuration for the intended environment. Never put an admin password, service-role key or other private credential in a `VITE_` variable. Preview and Production can share a backend, so a deployment preview is not database isolation.

## Validation

```sh
npm ci --ignore-scripts
npm run test:security
npm run build
```

`review/LOCAL-VALIDATION.md` describes the disposable, loopback-only Supabase tests. The tests include Auth, RLS, concurrent booking requests, actual Realtime delivery, private-data preservation, admin edits propagating to an already-open public page, and mobile/desktop UI checks. Automated fixtures are synthetic. Runtime credentials, private backups and real environment files must remain outside this repository.

For the isolated mock-browser test:

```sh
VITE_SUPABASE_URL=http://127.0.0.1:54321 VITE_SUPABASE_ANON_KEY=isolated-test-publishable-key-only npm run build:isolated
npm run test:browser
```

Isolated builds reject non-loopback backends and disable external contact actions. Tests block external requests. The codebase still has lint warnings and a bundle-size warning.

## Database changes

`supabase_schema.sql` is intentionally disabled because the old schema granted public access. `review/clinic-security.sql` is the replacement migration template. Existing private arrays deliberately stop that template. For an existing clinic, `review/clinic-preservation-prefix.sql` prepares a protected checkpoint before stripping the public copy, and requires an independently exported, restore-verified content checksum. Compose both in one transaction and validate the exact target before execution.

Preserve all original appointments and the full original settings document, including legacy versions and extra fields. Do not merge, cancel or delete conflicting records as a shortcut. Keep public intake closed during maintenance. Reopening requires a separate decision and abuse-control review. The protected in-project checkpoint is not an independent disaster-recovery backup.

The old mobile client still uses the previous access model. It cannot be made compatible by weakening RLS. Staff provisioning must use a protected process; the web app cannot create roles. Staff sessions are memory-only and require sign-in after a reload.

## Separate workflows

This website does not send WhatsApp messages or schedule daily reports. Those need a separately authorized delivery route, audience and wording. A saved booking is pending clinic confirmation, not proof of a staff notification or a guaranteed appointment.
