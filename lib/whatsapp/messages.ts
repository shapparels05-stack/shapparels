import { SITE_NAME, SITE_URL, CURRENCY_SYMBOL } from "@/lib/constants";
import type { EmailOrder } from "@/lib/email/templates";

// WhatsApp supports lightweight markdown: *bold*, _italic_.

function money(value: string | number) {
  const n = typeof value === "string" ? parseFloat(value) : value;
  return `${CURRENCY_SYMBOL} ${n.toLocaleString("en-PK")}`;
}

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || "there";
}

function itemLines(order: EmailOrder) {
  return order.items
    .map(
      (i) =>
        `• ${i.productName}${i.variantLabel ? ` (${i.variantLabel})` : ""} ×${i.quantity}`
    )
    .join("\n");
}

// ---- Customer messages (freeform body; used in sandbox/24h sessions and as
// the wa.me prefill for the manual admin buttons) ----

export function orderPlacedBody(order: EmailOrder) {
  return [
    `Hi ${firstName(order.customerName)}! 🎉 Thank you for your order at *${SITE_NAME}*.`,
    ``,
    `*Order:* ${order.orderNumber}`,
    itemLines(order),
    ``,
    `*Total:* ${money(order.total)} (Cash on Delivery)`,
    ``,
    `We'll confirm it shortly. Reply here if you have any questions. 💬`,
  ].join("\n");
}

export function statusBody(
  order: EmailOrder,
  status: "confirmed" | "shipped" | "cancelled"
) {
  const name = firstName(order.customerName);
  if (status === "confirmed") {
    return `Hi ${name}! ✅ Your order *${order.orderNumber}* is confirmed and being prepared for dispatch. Total ${money(order.total)} (COD).`;
  }
  if (status === "shipped") {
    const track =
      order.trackingNumber || order.courier
        ? `\n📦 ${order.courier ? order.courier + " — " : ""}${order.trackingNumber || ""}`.trimEnd()
        : "";
    return `Hi ${name}! 🚚 Your order *${order.orderNumber}* is on its way.${track}\nPlease keep ${money(order.total)} ready for Cash on Delivery.`;
  }
  // cancelled
  return `Hi ${name}, your order *${order.orderNumber}* has been cancelled. If this wasn't expected or you'd like to reorder, just reply here — we're happy to help.`;
}

export function adminNewOrderBody(order: EmailOrder) {
  const count = order.items.reduce((s, i) => s + i.quantity, 0);
  return [
    `🛒 *New order* ${order.orderNumber}`,
    `${order.customerName} · ${order.customerPhone}`,
    `${count} item(s) · *${money(order.total)}*`,
    `${order.shippingCity}`,
    ``,
    `${SITE_URL}/admin/orders`,
  ].join("\n");
}

// ---- Optional approved-template config (for production messages outside the
// 24h window). Set a Content SID per event in env; we pass positional
// variables in the documented order. If no SID is set, we fall back to the
// freeform body above (valid in the sandbox / an open 24h session).
export const WA_TEMPLATES = {
  orderPlaced: process.env.TWILIO_WA_TEMPLATE_ORDER_PLACED,
  confirmed: process.env.TWILIO_WA_TEMPLATE_CONFIRMED,
  shipped: process.env.TWILIO_WA_TEMPLATE_SHIPPED,
  cancelled: process.env.TWILIO_WA_TEMPLATE_CANCELLED,
} as const;

// Variable maps matching the documented {{1}},{{2}},... order per template.
export function orderPlacedVars(order: EmailOrder): Record<string, string> {
  return { "1": firstName(order.customerName), "2": order.orderNumber, "3": money(order.total) };
}

export function statusVars(
  order: EmailOrder,
  status: "confirmed" | "shipped" | "cancelled"
): Record<string, string> {
  const base: Record<string, string> = {
    "1": firstName(order.customerName),
    "2": order.orderNumber,
  };
  if (status === "shipped") {
    base["3"] = [order.courier, order.trackingNumber].filter(Boolean).join(" ") || "—";
  }
  return base;
}
