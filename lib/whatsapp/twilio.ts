// Minimal Twilio WhatsApp sender using the REST API directly (no SDK).
// Stays inert until TWILIO_* env vars are set, so WhatsApp simply no-ops in
// dev / before setup — the order flow never depends on it.

const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
// The WhatsApp-enabled sender, e.g. "+14155238886" (Twilio sandbox) or your
// approved business number. We add the "whatsapp:" prefix ourselves.
const FROM = process.env.TWILIO_WHATSAPP_FROM;

export const twilioConfigured = Boolean(ACCOUNT_SID && AUTH_TOKEN && FROM);

interface SendArgs {
  to: string; // E.164 with leading +, e.g. +923001234567
  body?: string; // freeform text (only valid within a 24h session / sandbox)
  // For business-initiated messages outside the 24h window, WhatsApp requires
  // a pre-approved template referenced by its Content SID + variables.
  contentSid?: string;
  contentVariables?: Record<string, string>;
}

export async function sendWhatsApp(args: SendArgs): Promise<void> {
  if (!twilioConfigured) {
    console.warn("[whatsapp] Twilio not configured — skipping message");
    return;
  }

  const params = new URLSearchParams();
  params.set("From", FROM!.startsWith("whatsapp:") ? FROM! : `whatsapp:${FROM}`);
  params.set("To", `whatsapp:${args.to}`);

  if (args.contentSid) {
    params.set("ContentSid", args.contentSid);
    if (args.contentVariables) {
      params.set("ContentVariables", JSON.stringify(args.contentVariables));
    }
  } else if (args.body) {
    params.set("Body", args.body);
  } else {
    return;
  }

  try {
    const auth = Buffer.from(`${ACCOUNT_SID}:${AUTH_TOKEN}`).toString("base64");
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      }
    );
    if (!res.ok) {
      const text = await res.text();
      console.error("[whatsapp] send failed:", res.status, text);
    }
  } catch (err) {
    console.error("[whatsapp] send threw:", err);
  }
}
