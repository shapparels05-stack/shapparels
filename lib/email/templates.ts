import { SITE_NAME, SITE_URL, CURRENCY_SYMBOL, WHATSAPP_NUMBER } from "@/lib/constants";

// Plain-HTML email templates with inline styles (email clients strip <style>
// and ignore external CSS, so everything is inlined and table-based).

export interface EmailOrderItem {
  productName: string;
  variantLabel?: string | null;
  quantity: number;
  price: string; // unit price, numeric string
  total: string; // line total, numeric string
}

export interface EmailOrder {
  orderNumber: string;
  customerName: string;
  customerEmail?: string | null;
  customerPhone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingState?: string | null;
  shippingZipCode?: string | null;
  shippingCountry?: string | null;
  subtotal: string;
  shippingCost: string;
  total: string;
  paymentMethod?: string | null;
  notes?: string | null;
  trackingNumber?: string | null;
  courier?: string | null;
  items: EmailOrderItem[];
}

const BRAND = "#a8743d"; // warm gold accent
const INK = "#1f1a17";
const MUTED = "#6b625b";
const BORDER = "#ece6df";
const BG = "#f6f3ef";

function money(value: string | number) {
  const n = typeof value === "string" ? parseFloat(value) : value;
  return `${CURRENCY_SYMBOL} ${n.toLocaleString("en-PK")}`;
}

function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Shared shell: branded header, white content card, footer.
function layout(opts: { preheader: string; heading: string; body: string }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(opts.heading)}</title>
</head>
<body style="margin:0;padding:0;background:${BG};color:${INK};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(opts.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
  <tr><td style="padding:8px 4px 20px;text-align:center;">
    <a href="${SITE_URL}" style="text-decoration:none;color:${INK};font-size:22px;font-weight:700;letter-spacing:1px;">${esc(SITE_NAME)}</a>
  </td></tr>
  <tr><td style="background:#ffffff;border:1px solid ${BORDER};border-radius:14px;overflow:hidden;">
    <div style="height:4px;background:${BRAND};"></div>
    <div style="padding:32px 28px;">
      <h1 style="margin:0 0 16px;font-size:20px;line-height:1.3;color:${INK};">${esc(opts.heading)}</h1>
      ${opts.body}
    </div>
  </td></tr>
  <tr><td style="padding:22px 8px;text-align:center;color:${MUTED};font-size:12px;line-height:1.6;">
    <p style="margin:0 0 4px;">${esc(SITE_NAME)} — Premium Ladies Beauty Products</p>
    <p style="margin:0 0 4px;">Cash on Delivery across Pakistan</p>
    <p style="margin:0;"><a href="${SITE_URL}" style="color:${BRAND};text-decoration:none;">${SITE_URL.replace(/^https?:\/\//, "")}</a>${
      WHATSAPP_NUMBER ? ` &nbsp;·&nbsp; WhatsApp: +${esc(WHATSAPP_NUMBER)}` : ""
    }</p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function itemsTable(order: EmailOrder) {
  const rows = order.items
    .map(
      (it) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid ${BORDER};font-size:14px;color:${INK};">
        ${esc(it.productName)}${it.variantLabel ? `<br/><span style="color:${MUTED};font-size:12px;">${esc(it.variantLabel)}</span>` : ""}
        <br/><span style="color:${MUTED};font-size:12px;">Qty ${it.quantity} × ${money(it.price)}</span>
      </td>
      <td style="padding:10px 0;border-bottom:1px solid ${BORDER};font-size:14px;color:${INK};text-align:right;white-space:nowrap;">${money(it.total)}</td>
    </tr>`
    )
    .join("");

  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 4px;">
    ${rows}
    <tr>
      <td style="padding:12px 0 2px;font-size:13px;color:${MUTED};">Subtotal</td>
      <td style="padding:12px 0 2px;font-size:13px;color:${MUTED};text-align:right;">${money(order.subtotal)}</td>
    </tr>
    <tr>
      <td style="padding:2px 0;font-size:13px;color:${MUTED};">Shipping</td>
      <td style="padding:2px 0;font-size:13px;color:${MUTED};text-align:right;">${parseFloat(order.shippingCost) === 0 ? "FREE" : money(order.shippingCost)}</td>
    </tr>
    <tr>
      <td style="padding:8px 0 0;font-size:16px;font-weight:700;color:${INK};border-top:2px solid ${BORDER};">Total</td>
      <td style="padding:8px 0 0;font-size:16px;font-weight:700;color:${INK};text-align:right;border-top:2px solid ${BORDER};">${money(order.total)}</td>
    </tr>
  </table>`;
}

function addressBlock(order: EmailOrder) {
  const line2 = [order.shippingCity, order.shippingState, order.shippingZipCode]
    .filter(Boolean)
    .join(", ");
  return `
  <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:${INK};">Delivery to</p>
  <p style="margin:0;font-size:13px;line-height:1.6;color:${MUTED};">
    ${esc(order.customerName)}<br/>
    ${esc(order.shippingAddress)}<br/>
    ${esc(line2)}<br/>
    ${esc(order.shippingCountry || "Pakistan")}<br/>
    ${esc(order.customerPhone)}
  </p>`;
}

function paragraph(text: string) {
  return `<p style="margin:0 0 14px;font-size:14px;line-height:1.7;color:${MUTED};">${text}</p>`;
}

function button(label: string, href: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 4px;"><tr><td style="background:${BRAND};border-radius:8px;">
    <a href="${href}" style="display:inline-block;padding:11px 22px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;">${esc(label)}</a>
  </td></tr></table>`;
}

// ---- Customer: order placed (receipt) ----
export function orderPlacedCustomerEmail(order: EmailOrder) {
  const firstName = order.customerName.trim().split(/\s+/)[0] || "there";
  const body = `
    ${paragraph(`Hi ${esc(firstName)}, thank you for shopping with ${esc(SITE_NAME)}! We've received your order and our team will confirm it shortly.`)}
    <p style="margin:0 0 18px;font-size:14px;color:${INK};">Order <strong>${esc(order.orderNumber)}</strong></p>
    ${itemsTable(order)}
    <div style="height:1px;background:${BORDER};margin:20px 0;"></div>
    ${addressBlock(order)}
    <div style="margin:18px 0 6px;padding:12px 14px;background:${BG};border-radius:8px;font-size:13px;color:${INK};">
      💵 Payment: <strong>Cash on Delivery</strong> — pay ${money(order.total)} when your parcel arrives.
    </div>
    ${paragraph("We'll email you again as soon as your order is confirmed and on its way.")}
    ${button("View our store", SITE_URL)}
  `;
  return {
    subject: `Order received — ${order.orderNumber}`,
    html: layout({
      preheader: `Thanks ${firstName}! We've received order ${order.orderNumber}.`,
      heading: "We've received your order 🎉",
      body,
    }),
  };
}

// ---- Admin: new order notification ----
export function orderPlacedAdminEmail(order: EmailOrder) {
  const adminUrl = `${SITE_URL}/admin/orders`;
  const body = `
    ${paragraph(`A new order just came in. Review and process it in the admin panel.`)}
    <p style="margin:0 0 6px;font-size:14px;color:${INK};">Order <strong>${esc(order.orderNumber)}</strong></p>
    <p style="margin:0 0 16px;font-size:13px;color:${MUTED};">
      ${esc(order.customerName)} · ${esc(order.customerPhone)}${order.customerEmail ? ` · ${esc(order.customerEmail)}` : ""}
    </p>
    ${itemsTable(order)}
    <div style="height:1px;background:${BORDER};margin:20px 0;"></div>
    ${addressBlock(order)}
    ${order.notes ? `<div style="margin-top:16px;font-size:13px;color:${INK};"><strong>Notes:</strong> ${esc(order.notes)}</div>` : ""}
    <div style="margin-top:8px;">${button("Open in admin", adminUrl)}</div>
  `;
  return {
    subject: `🛒 New order ${order.orderNumber} — ${money(order.total)}`,
    html: layout({
      preheader: `${order.customerName} placed order ${order.orderNumber} for ${money(order.total)}.`,
      heading: "New order received",
      body,
    }),
  };
}

// ---- Customer: status updates ----
type StatusEmailKey = "confirmed" | "shipped" | "cancelled";

export function orderStatusCustomerEmail(order: EmailOrder, status: StatusEmailKey) {
  const firstName = order.customerName.trim().split(/\s+/)[0] || "there";

  const copy: Record<StatusEmailKey, { heading: string; subject: string; intro: string; preheader: string }> = {
    confirmed: {
      heading: "Your order is confirmed ✅",
      subject: `Order confirmed — ${order.orderNumber}`,
      intro: `Good news ${esc(firstName)}! Your order has been confirmed and our team is now preparing it for dispatch.`,
      preheader: `Order ${order.orderNumber} is confirmed and being prepared.`,
    },
    shipped: {
      heading: "Your order is on its way 🚚",
      subject: `Your order has shipped — ${order.orderNumber}`,
      intro: `Great news ${esc(firstName)}! Your order is on its way to you. Please keep ${money(order.total)} ready for Cash on Delivery.`,
      preheader: `Order ${order.orderNumber} has shipped.`,
    },
    cancelled: {
      heading: "Your order has been cancelled",
      subject: `Order cancelled — ${order.orderNumber}`,
      intro: `Hi ${esc(firstName)}, your order ${esc(order.orderNumber)} has been cancelled. If this wasn't expected or you'd like to reorder, just reply or reach us on WhatsApp — we're happy to help.`,
      preheader: `Order ${order.orderNumber} has been cancelled.`,
    },
  };

  const c = copy[status];

  const tracking =
    status === "shipped" && (order.trackingNumber || order.courier)
      ? `<div style="margin:4px 0 18px;padding:12px 14px;background:${BG};border-radius:8px;font-size:13px;color:${INK};">
           📦 Tracking${order.courier ? ` (${esc(order.courier)})` : ""}: <strong>${esc(order.trackingNumber || "—")}</strong>
         </div>`
      : "";

  const body = `
    ${paragraph(c.intro)}
    <p style="margin:0 0 16px;font-size:14px;color:${INK};">Order <strong>${esc(order.orderNumber)}</strong></p>
    ${tracking}
    ${itemsTable(order)}
    <div style="margin-top:18px;">${button("View our store", SITE_URL)}</div>
  `;

  return {
    subject: c.subject,
    html: layout({ preheader: c.preheader, heading: c.heading, body }),
  };
}
