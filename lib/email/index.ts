import { resend, EMAIL_FROM, STORE_NOTIFICATION_EMAIL } from "./resend";
import {
  orderPlacedCustomerEmail,
  orderPlacedAdminEmail,
  orderStatusCustomerEmail,
  type EmailOrder,
} from "./templates";

// Low-level send. Never throws — email must never break the order flow.
// No-ops (with a log) when Resend isn't configured.
async function sendEmail(opts: {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}) {
  if (!resend) {
    console.warn(`[email] RESEND_API_KEY not set — skipping "${opts.subject}"`);
    return;
  }
  try {
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      ...(opts.replyTo ? { replyTo: opts.replyTo } : {}),
    });
    if (error) console.error("[email] send failed:", opts.subject, error);
  } catch (err) {
    console.error("[email] send threw:", opts.subject, err);
  }
}

// Sent when an order is created: receipt to the customer (if they gave an
// email) + a "new order" alert to the store. Runs both in parallel.
export async function sendOrderPlacedEmails(order: EmailOrder) {
  const jobs: Promise<unknown>[] = [];

  if (order.customerEmail) {
    const { subject, html } = orderPlacedCustomerEmail(order);
    jobs.push(sendEmail({ to: order.customerEmail, subject, html }));
  }

  if (STORE_NOTIFICATION_EMAIL) {
    const { subject, html } = orderPlacedAdminEmail(order);
    const to = STORE_NOTIFICATION_EMAIL.split(",").map((s) => s.trim()).filter(Boolean);
    jobs.push(
      sendEmail({
        to,
        subject,
        html,
        // Replying to the alert reaches the customer directly, if they left an email.
        replyTo: order.customerEmail || undefined,
      })
    );
  }

  await Promise.all(jobs);
}

// Sent when the admin moves an order to confirmed / shipped / cancelled.
export async function sendOrderStatusEmail(
  order: EmailOrder,
  status: "confirmed" | "shipped" | "cancelled"
) {
  if (!order.customerEmail) return; // no email on file — nothing to send
  const { subject, html } = orderStatusCustomerEmail(order, status);
  await sendEmail({ to: order.customerEmail, subject, html });
}
