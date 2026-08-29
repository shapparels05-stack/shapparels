import crypto from "crypto";

// Meta Conversions API (server-side events). Mirrors the browser Pixel so Meta
// receives each event from both channels and deduplicates them via a shared
// event_id — this is what raises "event coverage". Inert (no-op) until
// META_CAPI_ACCESS_TOKEN is configured, so it is safe to ship without the token.

const PIXEL_ID = process.env.META_PIXEL_ID || "1549926503362795";
const ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN || "";
const TEST_CODE = process.env.META_CAPI_TEST_CODE || ""; // optional: Events Manager "Test events"
const API_VERSION = "v21.0";

export const isCapiEnabled = () => Boolean(ACCESS_TOKEN);

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

// Meta requires PII to be normalized then SHA-256 hashed.
function hashField(value?: string | null): string | undefined {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  return normalized ? sha256(normalized) : undefined;
}

function hashPhone(phone?: string | null): string | undefined {
  if (!phone) return undefined;
  const digits = phone.replace(/\D/g, ""); // digits only, keep country code
  return digits ? sha256(digits) : undefined;
}

export interface CapiUserData {
  email?: string | null;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  city?: string | null;
  country?: string | null;
  clientIp?: string | null;
  userAgent?: string | null;
  fbp?: string | null; // _fbp cookie
  fbc?: string | null; // _fbc cookie
  // First-party anonymous visitor id (_shid cookie); hashed into external_id.
  externalId?: string | null;
  // Already-SHA256-hashed match keys recovered from the `mua` cookie (set at
  // checkout) so browser-mirrored events from returning customers carry PII
  // match keys without any plaintext ever being stored client-side.
  prehashed?: Partial<Record<"em" | "ph" | "fn" | "ln" | "ct", string>> | null;
}

export interface CapiEvent {
  eventName: string;
  eventId: string; // MUST match the browser Pixel's eventID for dedup
  eventSourceUrl?: string;
  userData: CapiUserData;
  customData?: Record<string, unknown>;
  eventTime?: number; // unix seconds
}

export async function sendCapiEvents(events: CapiEvent[]): Promise<void> {
  if (!ACCESS_TOKEN || events.length === 0) return;

  const data = events.map((e) => {
    const u = e.userData;
    const user_data: Record<string, unknown> = {};
    const em = hashField(u.email);
    const ph = hashPhone(u.phone);
    const fn = hashField(u.firstName);
    const ln = hashField(u.lastName);
    const ct = hashField(u.city);
    const co = hashField(u.country);
    const pre = u.prehashed || {};
    if (em || pre.em) user_data.em = [em || pre.em];
    if (ph || pre.ph) user_data.ph = [ph || pre.ph];
    if (fn || pre.fn) user_data.fn = [fn || pre.fn];
    if (ln || pre.ln) user_data.ln = [ln || pre.ln];
    if (ct || pre.ct) user_data.ct = [ct || pre.ct];
    if (co) user_data.country = [co];
    if (u.externalId) user_data.external_id = [sha256(u.externalId)];
    if (u.clientIp) user_data.client_ip_address = u.clientIp;
    if (u.userAgent) user_data.client_user_agent = u.userAgent;
    if (u.fbp) user_data.fbp = u.fbp;
    if (u.fbc) user_data.fbc = u.fbc;

    return {
      event_name: e.eventName,
      event_time: e.eventTime ?? Math.floor(Date.now() / 1000),
      event_id: e.eventId,
      event_source_url: e.eventSourceUrl,
      action_source: "website",
      user_data,
      custom_data: e.customData,
    };
  });

  const body: Record<string, unknown> = { data };
  if (TEST_CODE) body.test_event_code = TEST_CODE;

  try {
    const res = await fetch(
      `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events?access_token=${encodeURIComponent(ACCESS_TOKEN)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );
    if (!res.ok) {
      console.error("[meta-capi] non-ok:", res.status, await res.text());
    }
  } catch (err) {
    console.error("[meta-capi] send failed:", err);
  }
}

// Extract the request context Meta uses for matching browser-initiated events.
export function capiContextFromRequest(req: Request): CapiUserData {
  const headers = req.headers;
  const cookieHeader = headers.get("cookie") || "";
  const cookies = Object.fromEntries(
    cookieHeader.split(";").map((c) => {
      const [k, ...v] = c.trim().split("=");
      return [k, v.join("=")];
    })
  );
  const forwarded = headers.get("x-forwarded-for");
  const clientIp = forwarded?.split(",")[0]?.trim() || headers.get("x-real-ip");

  // Hashed match keys remembered from a previous checkout (see buildMatchCookie).
  let prehashed: CapiUserData["prehashed"] = null;
  if (cookies["mua"]) {
    try {
      const parsed = JSON.parse(Buffer.from(cookies["mua"], "base64url").toString("utf8"));
      if (parsed && typeof parsed === "object") {
        prehashed = {};
        for (const k of ["em", "ph", "fn", "ln", "ct"] as const) {
          if (typeof parsed[k] === "string" && /^[a-f0-9]{64}$/.test(parsed[k])) {
            prehashed[k] = parsed[k];
          }
        }
      }
    } catch {}
  }

  return {
    clientIp: clientIp || null,
    userAgent: headers.get("user-agent"),
    fbp: cookies["_fbp"] || null,
    fbc: cookies["_fbc"] || null,
    externalId: cookies["_shid"] || null,
    prehashed,
  };
}

// Value for the `mua` (Meta user attributes) cookie: SHA-256 hashes of the
// customer's match keys, set after checkout so LATER browser events (which have
// no form data) still carry PII match keys. Hashes only — never plaintext.
export function buildMatchCookie(data: {
  email?: string | null;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  city?: string | null;
}): string {
  const value: Record<string, string> = {};
  const em = hashField(data.email);
  const ph = hashPhone(data.phone);
  const fn = hashField(data.firstName);
  const ln = hashField(data.lastName);
  const ct = hashField(data.city);
  if (em) value.em = em;
  if (ph) value.ph = ph;
  if (fn) value.fn = fn;
  if (ln) value.ln = ln;
  if (ct) value.ct = ct;
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}
