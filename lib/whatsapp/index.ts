import { sendWhatsApp, twilioConfigured } from "./twilio";
import { toE164Pk } from "./phone";
import {
  orderPlacedBody,
  statusBody,
  adminNewOrderBody,
  orderPlacedVars,
  statusVars,
  WA_TEMPLATES,
} from "./messages";
import type { EmailOrder } from "@/lib/email/templates";
import { WHATSAPP_NUMBER } from "@/lib/constants";

// Where store WhatsApp alerts go. A dedicated admin number can override the
// public business number.
const ADMIN_WA = process.env.TWILIO_ADMIN_WHATSAPP || WHATSAPP_NUMBER;

export { twilioConfigured };

// Auto-send on order placement: confirmation to the customer + alert to store.
export async function sendOrderPlacedWhatsApp(order: EmailOrder) {
  if (!twilioConfigured) return;

  const jobs: Promise<unknown>[] = [];

  const to = toE164Pk(order.customerPhone);
  if (to) {
    jobs.push(
      sendWhatsApp({
        to,
        body: orderPlacedBody(order),
        contentSid: WA_TEMPLATES.orderPlaced,
        contentVariables: WA_TEMPLATES.orderPlaced ? orderPlacedVars(order) : undefined,
      })
    );
  }

  const admin = ADMIN_WA ? toE164Pk(ADMIN_WA) : null;
  if (admin) {
    // Admin alert is a freeform body (the store keeps an open session with its
    // own number); no template needed.
    jobs.push(sendWhatsApp({ to: admin, body: adminNewOrderBody(order) }));
  }

  await Promise.all(jobs);
}

// Auto-send on status change (confirmed / shipped / cancelled).
export async function sendOrderStatusWhatsApp(
  order: EmailOrder,
  status: "confirmed" | "shipped" | "cancelled"
) {
  if (!twilioConfigured) return;
  const to = toE164Pk(order.customerPhone);
  if (!to) return;

  const sid = WA_TEMPLATES[status];
  await sendWhatsApp({
    to,
    body: statusBody(order, status),
    contentSid: sid,
    contentVariables: sid ? statusVars(order, status) : undefined,
  });
}
