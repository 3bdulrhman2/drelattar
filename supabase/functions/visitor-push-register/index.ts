import { createClient } from "npm:@supabase/supabase-js@2";
// visitor-push-register: public endpoint the website calls after a visitor allows notifications.
// Stores the visitor FCM web token (server-side table, no client access). The token is checked with an FCM
// validate_only call (nothing is delivered) so junk strings are rejected. No personal data is stored.
const PROJECT = "drelattarclinic";
function b64url(d: ArrayBuffer | string): string {
  const bytes = typeof d === "string" ? new TextEncoder().encode(d) : new Uint8Array(d);
  let bin = ""; for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
async function mintToken(sa: any): Promise<string> {
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

const c = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const secret = Deno.env.get("CLINIC_FCM_SERVICE_ACCOUNT");
const cred = secret ? JSON.parse(secret) : null;
let access = "", expires = 0;
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const reply = (s: number, b: unknown) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });
const MAX_DEVICES = 20000;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return reply(405, { error: "method_not_allowed" });
  try {
    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? "register");
    const token = String(body.token ?? "");
    if (!/^[A-Za-z0-9_\-:.]{100,400}$/.test(token)) return reply(400, { error: "invalid_token" });
    if (action === "unregister") {
      await c.from("visitor_push_devices").delete().eq("token", token);
      return reply(200, { ok: true });
    }
    if (action !== "register") return reply(400, { error: "invalid_action" });
    if (!cred || cred.project_id !== PROJECT) return reply(503, { error: "not_configured" });
    const { data: existing } = await c.from("visitor_push_devices").select("token").eq("token", token).maybeSingle();
    if (existing) {
      await c.from("visitor_push_devices").update({ last_seen: new Date().toISOString() }).eq("token", token);
      return reply(200, { ok: true });
    }
    const { count } = await c.from("visitor_push_devices").select("token", { count: "exact", head: true });
    if ((count ?? 0) >= MAX_DEVICES) return reply(429, { error: "full" });
    if (Date.now() >= expires) { access = await mintToken(cred); expires = Date.now() + 50 * 60 * 1000; }
    const v = await fetch(`https://fcm.googleapis.com/v1/projects/${PROJECT}/messages:send`, {
      method: "POST", headers: { Authorization: "Bearer " + access, "Content-Type": "application/json" },
      body: JSON.stringify({ validate_only: true, message: { token, notification: { title: "t", body: "t" } } }) });
    if (!v.ok) return reply(400, { error: "token_rejected" });
    const { error } = await c.from("visitor_push_devices").insert({ token });
    if (error) return reply(500, { error: "failed" });
    return reply(200, { ok: true });
  } catch { return reply(500, { error: "failed" }); }
});
