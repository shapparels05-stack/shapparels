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
    if (em) user_data.em = [em];
    if (ph) user_data.ph = [ph];
    if (fn) user_data.fn = [fn];
    if (ln) user_data.ln = [ln];
    if (ct) user_data.ct = [ct];
    if (co) user_data.country = [co];
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
  return {
    clientIp: clientIp || null,
    userAgent: headers.get("user-agent"),
    fbp: cookies["_fbp"] || null,
    fbc: cookies["_fbc"] || null,
  };
}
