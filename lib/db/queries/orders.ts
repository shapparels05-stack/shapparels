import { db } from "@/lib/db";
import { orders, orderItems, products, productVariants } from "@/lib/db/schema";
import { eq, desc, sql, and } from "drizzle-orm";

export async function createOrder(data: {
  orderNumber: string;
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingState?: string;
  shippingZipCode?: string;
  subtotal: string;
  shippingCost: string;
  total: string;
  notes?: string;
  items: {
    productId: string;
    productName: string;
    productSlug: string;
    productImage?: string | null;
    variantId?: string | null;
    variantLabel?: string | null;
    price: string;
    quantity: number;
    total: string;
  }[];
}) {
  const { items, ...orderData } = data;

  const [order] = await db.insert(orders).values(orderData).returning();

  if (items.length > 0) {
    await db.insert(orderItems).values(
      items.map((item) => ({
        orderId: order.id,
        productId: item.productId,
        productName: item.productName,
        productSlug: item.productSlug,
        productImage: item.productImage,
        variantId: item.variantId,
        variantLabel: item.variantLabel,
        price: item.price,
        quantity: item.quantity,
        total: item.total,
      }))
    );
  }

  return order;
}

export async function getOrderByNumber(orderNumber: string) {
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.orderNumber, orderNumber))
    .limit(1);

  if (!order) return null;

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, order.id));

  return { ...order, items };
}

export async function getOrderById(id: string) {
  const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!order) return null;

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, order.id));

  return { ...order, items };
}

// Add the order's quantities back to product / variant stock. Used when an
// order is cancelled so the inventory deducted at placement is released.
export async function restockOrder(orderId: string) {
  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));

  await Promise.all(
    items.map((item) => {
      if (item.variantId) {
        return db
          .update(productVariants)
          .set({ stock: sql`${productVariants.stock} + ${item.quantity}` })
          .where(eq(productVariants.id, item.variantId));
      }
      if (item.productId) {
        return db
          .update(products)
          .set({ stock: sql`${products.stock} + ${item.quantity}` })
          .where(eq(products.id, item.productId));
      }
      return Promise.resolve();
    })
  );
}

export async function getOrders(options: {
  status?: string;
  page?: number;
  limit?: number;
} = {}) {
  const { page = 1, limit = 20, status } = options;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (status && status !== "all") {
    conditions.push(eq(orders.status, status as any));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [orderList, countResult] = await Promise.all([
    db
      .select()
      .from(orders)
      .where(whereClause)
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(whereClause),
  ]);

  return {
    orders: orderList,
    total: Number(countResult[0]?.count ?? 0),
    page,
    limit,
    totalPages: Math.ceil(Number(countResult[0]?.count ?? 0) / limit),
  };
}

export async function updateOrderStatus(id: string, status: string) {
  const [updated] = await db
    .update(orders)
    .set({ status: status as any })
    .where(eq(orders.id, id))
    .returning();
  return updated;
}

export function generateOrderNumber() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.floor(Math.random() * 999)
    .toString()
    .padStart(3, "0");
  return `SH-${date}-${random}`;
}

export async function getOrderStats() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 7);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [todayOrders, weekOrders, monthOrders, totalProducts] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)`, revenue: sql<string>`COALESCE(SUM(CAST(total AS DECIMAL)), 0)` })
      .from(orders)
      .where(sql`${orders.createdAt} >= ${todayStart.toISOString()}`),
    db
      .select({ count: sql<number>`count(*)`, revenue: sql<string>`COALESCE(SUM(CAST(total AS DECIMAL)), 0)` })
      .from(orders)
      .where(sql`${orders.createdAt} >= ${weekStart.toISOString()}`),
    db
      .select({ count: sql<number>`count(*)`, revenue: sql<string>`COALESCE(SUM(CAST(total AS DECIMAL)), 0)` })
      .from(orders)
      .where(sql`${orders.createdAt} >= ${monthStart.toISOString()}`),
    db.select({ count: sql<number>`count(*)` }).from(products),
  ]);

  return {
    today: { count: Number(todayOrders[0]?.count ?? 0), revenue: todayOrders[0]?.revenue ?? "0" },
    week: { count: Number(weekOrders[0]?.count ?? 0), revenue: weekOrders[0]?.revenue ?? "0" },
    month: { count: Number(monthOrders[0]?.count ?? 0), revenue: monthOrders[0]?.revenue ?? "0" },
    totalProducts: Number(totalProducts[0]?.count ?? 0),
  };
}
