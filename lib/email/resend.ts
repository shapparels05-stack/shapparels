import { Resend } from "resend";

// Lazy, inert-by-default Resend client. Stays null until RESEND_API_KEY is set,
// so emails simply no-op in dev / before the key is configured (the order flow
// never breaks because email isn't wired up).
const apiKey = process.env.RESEND_API_KEY;

export const resend = apiKey ? new Resend(apiKey) : null;

// "From" address. Use a verified shapparels.pk sender in production; falls back
// to Resend's shared sandbox sender so test sends work before domain verification.
export const EMAIL_FROM =
  process.env.EMAIL_FROM || "SH Apparels <onboarding@resend.dev>";

// Where the store's own "new order" notifications go. Comma-separated for
// multiple recipients. Blank = admin notifications are skipped.
export const STORE_NOTIFICATION_EMAIL = process.env.STORE_NOTIFICATION_EMAIL || "";
