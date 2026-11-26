import { createClient } from "npm:@supabase/supabase-js@2";

// clinic-staff-notify: visible staff push notifications for booking events.
// kind=new_booking      -> every active staff device (doctor + secretary):
//                          a new website booking arrived (name, date, time).
// kind=patient_entering -> doctor (admin) devices only: reception moved a
//                          patient into consultation; carries the patient name.
// Called only by the database triggers with the shared vault secret, same
// pattern as booking-sync-push. No caller-supplied audience: roles come from
// clinic_staff, tokens from clinic_staff_devices.
const c = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const secret = Deno.env.get("CLINIC_FCM_SERVICE_ACCOUNT");
const cred = secret ? JSON.parse(secret) : null;
const PROJECT = "drelattarclinic";
let access = "", expires = 0;

function b64url(d: ArrayBuffer | string): string {
  const bytes = typeof d === "string" ? new TextEncoder().encode(d) : new Uint8Array(d);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
async function token(sa: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }))}.${b64url(JSON.stringify({
    iss: sa.client_email, scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: sa.token_uri ?? "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 }))}`;
  const pem = sa.private_key.replace(/-----(BEGIN|END) PRIVATE KEY-----/g, "").replace(/\s+/g, "");
  const key = await crypto.subtle.importKey("pkcs8", Uint8Array.from(atob(pem), (x) => x.charCodeAt(0)),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned));
  const r = await fetch(sa.token_uri ?? "https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${unsigned}.${b64url(sig)}` });
  if (!r.ok) throw new Error("token");
  return (await r.json()).access_token;
}
function same(a: string, b: string) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}
const reply = (s: number, b: unknown) => new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method !== "POST") return reply(405, { error: "method_not_allowed" });
  try {
    const given = req.headers.get("x-sync-secret") ?? "";
    const { data: expected } = await c.rpc("clinic_booking_sync_secret");
    if (!given || typeof expected !== "string" || !same(given, expected)) return reply(401, { error: "unauthorized" });
    if (!cred || cred.project_id !== PROJECT) return reply(503, { error: "not_configured" });

    const body = await req.json().catch(() => ({}));
    const kind = String(body.kind ?? "");
    const name = String(body.name ?? "").trim();
    if (!["new_booking", "patient_entering"].includes(kind) || name.length < 2 || name.length > 120) {
      return reply(400, { error: "invalid_input" });
    }
    const date = String(body.date ?? "");
    const time = String(body.time ?? "");
    const title = kind === "new_booking" ? "حجز جديد من الموقع" : "مريض دخل للكشف";
    const text = kind === "new_booking"
      ? `${name} — ${date} ${time}`
      : `${name}${time ? ` (معاد ${time})` : ""}`;

    // Audience: new bookings go to every active staff member; patient-entering goes to the doctor only.
    const roles = kind === "new_booking" ? ["admin", "secretary"] : ["admin"];
    const { data: staff } = await c.from("clinic_staff").select("user_id").in("role", roles).eq("is_active", true);
    const ids = (staff ?? []).map((a: any) => a.user_id);
    if (!ids.length) return reply(200, { sent: 0 });
    const { data: devs } = await c.from("clinic_staff_devices").select("token").in("user_id", ids).limit(40);
    if (!devs?.length) return reply(200, { sent: 0 });

    if (Date.now() >= expires) { access = await token(cred); expires = Date.now() + 50 * 60 * 1000; }
    let sent = 0;
    for (const d of devs) {
      const r = await fetch(`https://fcm.googleapis.com/v1/projects/${PROJECT}/messages:send`, {
        method: "POST", headers: { Authorization: "Bearer " + access, "Content-Type": "application/json" },
        body: JSON.stringify({
          message: {
            token: d.token,
            notification: { title, body: text },
            data: { type: kind, name, date, time },
            android: { priority: "HIGH" },
          },
        }) });
      if (r.ok) sent++;
      else {
        let b: any = {}; try { b = await r.json(); } catch { /* ignore */ }
        if ((b.error?.details || []).some((x: any) => x.errorCode === "UNREGISTERED")) await c.from("clinic_staff_devices").delete().eq("token", d.token);
      }
    }
    return reply(200, { sent });
  } catch { return reply(500, { error: "failed" }); }
});
