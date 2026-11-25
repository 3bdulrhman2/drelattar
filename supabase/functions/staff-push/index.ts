// staff-push: sends a broadcast push notification to clinic STAFF devices.
//
// Caller must be a signed-in staff member (Supabase Auth JWT + active row in
// clinic_staff). Delivery is via Firebase Cloud Messaging DIRECTLY to the
// registered staff device tokens stored in clinic_settings - never to an FCM
// topic. Topic subscriptions are client-side and unrestricted (the Firebase
// client config ships with the app), so a topic cannot be an authorization
// boundary: anyone with the app config could subscribe. Device tokens can
// only be targeted by this server-side function. Broadcasts carry only the
// staff-composed announcement text; patient booking details never go through
// FCM (booking alerts stay on the RLS-gated realtime channel instead).
//
// Required secrets (supabase secrets set):
//   FIREBASE_SERVICE_ACCOUNT  - JSON of a Google service account granted ONLY
//                               the FCM send role on project drelattarclinic
//
// Deno runtime (Supabase Edge Functions). No external npm deps.

import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function b64url(data: ArrayBuffer | Uint8Array | string): string {
  let bytes: Uint8Array;
  if (typeof data === "string") bytes = new TextEncoder().encode(data);
  else bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function getGoogleAccessToken(sa: {
  client_email: string;
  private_key: string;
  token_uri?: string;
}): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claim = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: sa.token_uri ?? "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };
  const unsigned = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(claim))}`;

  const pem = sa.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");
  const keyBytes = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey(
    "pkcs8",
    keyBytes,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(unsigned),
  );
  const jwt = `${unsigned}.${b64url(sig)}`;

  const tokenRes = await fetch(sa.token_uri ?? "https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  if (!tokenRes.ok) throw new Error(`google token exchange failed: ${tokenRes.status}`);
  const tokenJson = await tokenRes.json();
  return tokenJson.access_token;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response("method not allowed", { status: 405, headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  // 1. Verify the caller's own JWT.
  const authHeader = req.headers.get("Authorization") ?? "";
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // 2. Confirm the caller is active staff.
  const admin = createClient(supabaseUrl, serviceRoleKey);
  const { data: staff } = await admin
    .from("clinic_staff")
    .select("role,is_active")
    .eq("user_id", userData.user.id)
    .eq("is_active", true)
    .maybeSingle();
  if (!staff) {
    return new Response(JSON.stringify({ error: "not_staff" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // 3. Validate the message.
  let title = "";
  let body = "";
  try {
    const json = await req.json();
    title = String(json.title ?? "").trim();
    body = String(json.body ?? "").trim();
  } catch { /* fall through */ }
  if (!title || !body || title.length > 120 || body.length > 500) {
    return new Response(JSON.stringify({ error: "invalid_message" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // 4. Collect registered staff device tokens (server-side read).
  const saRaw = Deno.env.get("FIREBASE_SERVICE_ACCOUNT");
  if (!saRaw) {
    return new Response(JSON.stringify({ error: "push_not_configured" }), {
      status: 503,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const { data: settingsRow } = await admin
    .from("clinic_settings")
    .select("content")
    .eq("key", "main_settings")
    .maybeSingle();
  const rawTokens = settingsRow?.content?.deviceTokens;
  const tokens: string[] = Array.isArray(rawTokens)
    ? rawTokens
        .map((t: unknown) =>
          t && typeof t === "object" ? String((t as Record<string, unknown>).token ?? "") : "",
        )
        .filter((t: string) => t.length > 20)
    : [];
  if (tokens.length === 0) {
    return new Response(JSON.stringify({ error: "no_staff_devices" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // 5. Send via FCM v1 directly to each registered staff device token.
  const sa = JSON.parse(saRaw);
  const accessToken = await getGoogleAccessToken(sa);
  const results = await Promise.allSettled(
    tokens.map((token) =>
      fetch(`https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: {
            token,
            notification: { title, body },
            data: { type: "staff_broadcast", title, body },
          },
        }),
      }),
    ),
  );
  const sent = results.filter((r) => r.status === "fulfilled" && r.value.ok).length;
  if (sent === 0) {
    return new Response(JSON.stringify({ error: "fcm_failed", sent }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true, sent, devices: tokens.length }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
