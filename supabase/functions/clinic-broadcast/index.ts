import { createClient } from "npm:@supabase/supabase-js@2";
// clinic-broadcast: staff-composed notification from the app. Audience: staff (doctor+secretary devices),
// visitors (site visitors who allowed web push) or all. Doctor (admin) JWT required to send; staff can read status.
// dry_run uses FCM validate_only (nothing is delivered). Live sends to visitors are refused until
// clinic_push_flags.visitor_live is true (owner approval), except a single registered test token (only_token).
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
const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
const secret = Deno.env.get("CLINIC_FCM_SERVICE_ACCOUNT");
const cred = secret ? JSON.parse(secret) : null;
let access = "", expires = 0;
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const reply = (s: number, b: unknown) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });
const SITE = "https://elattar.site/";
const MAX_VISITORS = 5000;

function sniff(b: Uint8Array): "jpeg" | "png" | null {
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpeg";
  if (b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "png";
  return null;
}
function safeLink(v: unknown): string | null {
  const s = String(v ?? "").trim();
  if (!s) return SITE;
  try {
    const u = new URL(s);
    if (u.protocol !== "https:" || !["elattar.site", "www.elattar.site"].includes(u.hostname)) return null;
    return u.href;
  } catch { return null; }
}

async function send(message: Record<string, unknown>, dry: boolean) {
  const r = await fetch(`https://fcm.googleapis.com/v1/projects/${PROJECT}/messages:send`, {
    method: "POST", headers: { Authorization: "Bearer " + access, "Content-Type": "application/json" },
    body: JSON.stringify({ validate_only: dry, message }) });
  if (r.ok) return { ok: true, dead: false };
  let b: any = {}; try { b = await r.json(); } catch { /* ignore */ }
  const dead = (b.error?.details || []).some((x: any) => x.errorCode === "UNREGISTERED") || b.error?.status === "NOT_FOUND";
  return { ok: false, dead };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return reply(405, { error: "method_not_allowed" });
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const uc = createClient(Deno.env.get("SUPABASE_URL")!, anon, { global: { headers: { Authorization: authHeader } } });
    const { data: ud, error: ue } = await uc.auth.getUser();
    if (ue || !ud?.user) return reply(401, { error: "unauthorized" });
    const { data: me } = await c.from("clinic_staff").select("role,is_active").eq("user_id", ud.user.id).eq("is_active", true).maybeSingle();
    if (!me || !["admin", "secretary"].includes(me.role)) return reply(403, { error: "not_staff" });

    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? "");
    const { data: flag } = await c.from("clinic_push_flags").select("enabled").eq("key", "visitor_live").maybeSingle();
    const visitorLive = flag?.enabled === true;

    const staffTokens = async () => {
      const { data: st } = await c.from("clinic_staff").select("user_id").in("role", ["admin", "secretary"]).eq("is_active", true);
      const ids = (st ?? []).map((x: any) => x.user_id);
      if (!ids.length) return [] as string[];
      const { data: d } = await c.from("clinic_staff_devices").select("token").in("user_id", ids).limit(100);
      return (d ?? []).map((x: any) => x.token as string);
    };

    if (action === "status") {
      const { count } = await c.from("visitor_push_devices").select("token", { count: "exact", head: true });
      return reply(200, { sendingReady: !!cred && cred.project_id === PROJECT, staffDevices: (await staffTokens()).length,
        visitorDevices: count ?? 0, visitorLive });
    }
    if (action !== "send") return reply(400, { error: "invalid_action" });
    if (me.role !== "admin") return reply(403, { error: "doctor_only" });
    if (!cred || cred.project_id !== PROJECT) return reply(503, { error: "not_configured" });

    const requestId = String(body.request_id ?? "");
    if (!/^[0-9a-f-]{36}$/i.test(requestId)) return reply(400, { error: "invalid_request_id" });
    const title = String(body.title ?? "").trim();
    const text = String(body.body ?? "").trim();
    const audience = String(body.audience ?? "");
    const dry = body.dry_run === true;
    const onlyToken = body.only_token ? String(body.only_token) : "";
    if (!title || !text || title.length > 120 || text.length > 500) return reply(400, { error: "invalid_message" });
    if (!["staff", "visitors", "all"].includes(audience)) return reply(400, { error: "invalid_audience" });
    const link = safeLink(body.link);
    if (!link) return reply(400, { error: "invalid_link" });
    if (audience !== "staff" && !dry && !onlyToken && !visitorLive) return reply(403, { error: "visitor_broadcast_not_enabled" });

    // Idempotency: one row per request id.
    const { data: prev } = await c.from("clinic_broadcasts").select("recipients,accepted,failed,dry_run").eq("request_id", requestId).maybeSingle();
    if (prev) return reply(200, { duplicate: true, recipients: prev.recipients, accepted: prev.accepted, failed: prev.failed, dry_run: prev.dry_run });

    // Optional image: stored in the public clinic-broadcast bucket so FCM can fetch it by https URL.
    let image: string | null = null;
    if (body.image_base64) {
      const raw = String(body.image_base64);
      if (raw.length > 1_500_000) return reply(400, { error: "image_too_large" });
      let bytes: Uint8Array;
      try { bytes = Uint8Array.from(atob(raw), (x) => x.charCodeAt(0)); } catch { return reply(400, { error: "invalid_image" }); }
      const kind = sniff(bytes);
      if (!kind || bytes.length > 1_000_000) return reply(400, { error: "invalid_image" });
      if (!dry) {
        const path = `${requestId}.${kind === "jpeg" ? "jpg" : "png"}`;
        const up = await c.storage.from("clinic-broadcast").upload(path, bytes, { contentType: `image/${kind}`, upsert: true });
        if (up.error) return reply(500, { error: "image_upload_failed" });
        image = c.storage.from("clinic-broadcast").getPublicUrl(path).data.publicUrl;
      } else {
        image = "https://elattar.site/brand/clinic-logo.png"; // dry run: validate an image field without storing anything
      }
    }

    const staffMsgs: Record<string, unknown>[] = [];
    const visitorMsgs: Record<string, unknown>[] = [];
    if (audience !== "visitors") {
      for (const t of await staffTokens()) {
        staffMsgs.push({ token: t, notification: { title, body: text, ...(image ? { image } : {}) },
          data: { type: "staff_manual", title, body: text }, android: { priority: "HIGH" } });
      }
    }
    const visitorTokens: string[] = [];
    if (audience !== "staff") {
      if (onlyToken) {
        const { data: one } = await c.from("visitor_push_devices").select("token").eq("token", onlyToken).maybeSingle();
        if (one) visitorTokens.push(one.token);
      } else {
        const { data: v } = await c.from("visitor_push_devices").select("token").limit(MAX_VISITORS);
        for (const x of v ?? []) visitorTokens.push(x.token);
      }
      for (const t of visitorTokens) {
        visitorMsgs.push({ token: t, notification: { title, body: text, ...(image ? { image } : {}) },
          data: { type: "announcement" },
          webpush: { headers: { TTL: "86400" }, notification: { icon: "/brand/clinic-logo.png", dir: "rtl", lang: "ar" },
            fcm_options: { link } } });
      }
    }

    const all = [...staffMsgs.map((m) => ({ m, v: false })), ...visitorMsgs.map((m) => ({ m, v: true }))];
    await c.from("clinic_broadcasts").insert({ request_id: requestId, created_by: ud.user.id, audience, dry_run: dry, title, recipients: all.length });
    if (Date.now() >= expires) { access = await mintToken(cred); expires = Date.now() + 50 * 60 * 1000; }
    let accepted = 0, failed = 0;
    for (let i = 0; i < all.length; i += 20) {
      const res = await Promise.all(all.slice(i, i + 20).map((x) => send(x.m, dry)));
      for (let j = 0; j < res.length; j++) {
        if (res[j].ok) accepted++; else failed++;
        if (res[j].dead && !dry) {
          const it = all[i + j];
          await c.from(it.v ? "visitor_push_devices" : "clinic_staff_devices").delete().eq("token", String(it.m.token));
        }
      }
    }
    await c.from("clinic_broadcasts").update({ accepted, failed }).eq("request_id", requestId);
    return reply(200, { recipients: all.length, accepted, failed, dry_run: dry, staff: staffMsgs.length, visitors: visitorMsgs.length });
  } catch { return reply(500, { error: "failed" }); }
});
