import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, orderItems } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { getOrderById, restockOrder } from "@/lib/db/queries/orders";
import { sendOrderStatusEmail } from "@/lib/email";
import { sendOrderStatusWhatsApp } from "@/lib/whatsapp";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/constants";

// Statuses that trigger a customer email when an order transitions into them.
const NOTIFY_STATUSES = ["confirmed", "shipped", "cancelled"] as const;
type NotifyStatus = (typeof NOTIFY_STATUSES)[number];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);

  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));

  return NextResponse.json({ ...order, items });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  if (!body.status) {
    return NextResponse.json({ error: "No update data" }, { status: 400 });
  }

  const newStatus = body.status as string;
  if (!ORDER_STATUSES.includes(newStatus as OrderStatus)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  // Load the current order so we can detect a real transition (only then do we
  // restock / email) and reuse its items for the email.
  const current = await getOrderById(id);
  if (!current) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const statusChanged = newStatus !== current.status;

  const updateData: {
    status: OrderStatus;
    trackingNumber?: string | null;
    courier?: string | null;
  } = { status: newStatus as OrderStatus };

  // Optional tracking details (sent when marking an order shipped).
  if (typeof body.trackingNumber === "string") {
    updateData.trackingNumber = body.trackingNumber.trim() || null;
  }
  if (typeof body.courier === "string") {
    updateData.courier = body.courier.trim() || null;
  }

  const [updated] = await db
    .update(orders)
    .set(updateData)
    .where(eq(orders.id, id))
    .returning();

  // Cancelling releases the stock that was deducted at placement (once only).
  if (newStatus === "cancelled" && current.status !== "cancelled") {
    await restockOrder(id);
  }

  // Notify the customer on real status transitions we care about (email + WhatsApp).
  if (statusChanged && NOTIFY_STATUSES.includes(newStatus as NotifyStatus)) {
    const notificationOrder = {
      orderNumber: updated.orderNumber,
      customerName: updated.customerName,
      customerEmail: updated.customerEmail,
      customerPhone: updated.customerPhone,
      shippingAddress: updated.shippingAddress,
      shippingCity: updated.shippingCity,
      shippingState: updated.shippingState,
      shippingZipCode: updated.shippingZipCode,
      shippingCountry: updated.shippingCountry,
      subtotal: updated.subtotal,
      shippingCost: updated.shippingCost,
      total: updated.total,
      trackingNumber: updated.trackingNumber,
      courier: updated.courier,
      items: current.items.map((i) => ({
        productName: i.productName,
        variantLabel: i.variantLabel,
        quantity: i.quantity,
        price: i.price,
        total: i.total,
      })),
    };
    await Promise.all([
      sendOrderStatusEmail(notificationOrder, newStatus as NotifyStatus),
      sendOrderStatusWhatsApp(notificationOrder, newStatus as NotifyStatus),
    ]);
  }

  return NextResponse.json(updated);
}
