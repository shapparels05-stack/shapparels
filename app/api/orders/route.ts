import { NextRequest, NextResponse } from "next/server";
import { createOrder, generateOrderNumber, getOrders } from "@/lib/db/queries/orders";
import { checkoutFormSchema } from "@/lib/validators/checkout";
import { db } from "@/lib/db";
import { products, productVariants } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { SHIPPING_COST, FREE_SHIPPING_THRESHOLD, CURRENCY, DEFAULT_COUNTRY } from "@/lib/constants";
import { sendCapiEvents, capiContextFromRequest } from "@/lib/meta-capi";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const result = await getOrders({
    status: searchParams.get("status") || undefined,
    page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
    limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : 20,
  });

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate checkout form fields
    const parsed = checkoutFormSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", errors: parsed.error.issues },
        { status: 400 }
      );
    }

    const { items } = body;
    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "Cart is empty" },
        { status: 400 }
      );
    }

    // Verify prices from DB and build order items
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      let verifiedPrice: number;

      if (item.variantId) {
        // Atomic: deduct stock only if enough available
        const [updated] = await db
          .update(productVariants)
          .set({ stock: sql`${productVariants.stock} - ${item.quantity}` })
          .where(
            and(
              eq(productVariants.id, item.variantId),
              sql`${productVariants.stock} >= ${item.quantity}`
            )!
          )
          .returning();

        if (!updated) {
          // Check if variant exists or just out of stock
          const [variant] = await db
            .select({ stock: productVariants.stock })
            .from(productVariants)
            .where(eq(productVariants.id, item.variantId))
            .limit(1);

          if (!variant) {
            return NextResponse.json(
              { error: `Variant not found for ${item.productName}` },
              { status: 400 }
            );
          }
          return NextResponse.json(
            { error: `Sorry, ${item.productName} only has ${variant.stock} left in stock.` },
            { status: 409 }
          );
        }
        verifiedPrice = parseFloat(updated.price);
      } else {
        // Atomic: deduct stock only if enough available
        const [updated] = await db
          .update(products)
          .set({ stock: sql`${products.stock} - ${item.quantity}` })
          .where(
            and(
              eq(products.id, item.productId),
              sql`${products.stock} >= ${item.quantity}`
            )!
          )
          .returning();

        if (!updated) {
          const [product] = await db
            .select({ stock: products.stock })
            .from(products)
            .where(eq(products.id, item.productId))
            .limit(1);

          if (!product) {
            return NextResponse.json(
              { error: `Product not found: ${item.productName}` },
              { status: 400 }
            );
          }
          return NextResponse.json(
            { error: `Sorry, ${item.productName} only has ${product.stock} left in stock.` },
            { status: 409 }
          );
        }
        verifiedPrice = parseFloat(updated.basePrice);
      }

      const lineTotal = verifiedPrice * item.quantity;
      subtotal += lineTotal;

      orderItems.push({
        productId: item.productId,
        productName: item.productName,
        productSlug: item.productSlug,
        productImage: item.productImage || null,
        variantId: item.variantId || null,
        variantLabel: item.variantLabel || null,
        price: verifiedPrice.toFixed(2),
        quantity: item.quantity,
        total: lineTotal.toFixed(2),
      });
    }

    const shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
    const total = subtotal + shippingCost;
    const orderNumber = generateOrderNumber();

    const order = await createOrder({
      orderNumber,
      customerName: parsed.data.customerName,
      customerEmail: parsed.data.customerEmail || undefined,
      customerPhone: parsed.data.customerPhone,
      shippingAddress: parsed.data.shippingAddress,
      shippingCity: parsed.data.shippingCity,
      shippingState: parsed.data.shippingState || undefined,
      shippingZipCode: parsed.data.shippingZipCode || undefined,
      subtotal: subtotal.toFixed(2),
      shippingCost: shippingCost.toFixed(2),
      total: total.toFixed(2),
      notes: parsed.data.notes || undefined,
      items: orderItems,
    });

    // Server-side Purchase (Conversions API). Uses a deterministic event_id
    // (purchase_<orderNumber>) matching the browser Pixel on the thank-you page
    // so Meta deduplicates the two. Hashed customer data gives a strong match.
    // Fire-and-forget so a CAPI hiccup never blocks the order response.
    const [firstName, ...rest] = parsed.data.customerName.trim().split(/\s+/);
    sendCapiEvents([
      {
        eventName: "Purchase",
        eventId: `purchase_${orderNumber}`,
        eventSourceUrl: request.headers.get("referer") || undefined,
        userData: {
          ...capiContextFromRequest(request),
          email: parsed.data.customerEmail || null,
          phone: parsed.data.customerPhone,
          firstName: firstName || null,
          lastName: rest.join(" ") || null,
          city: parsed.data.shippingCity || null,
          country: DEFAULT_COUNTRY,
        },
        customData: {
          currency: CURRENCY,
          value: Number(total.toFixed(2)),
          content_type: "product",
          contents: orderItems.map((i) => ({
            id: i.productId,
            quantity: i.quantity,
            item_price: Number(i.price),
          })),
          content_ids: orderItems.map((i) => i.productId),
          num_items: orderItems.reduce((s, i) => s + i.quantity, 0),
        },
      },
    ]).catch(() => {});

    return NextResponse.json(
      { orderNumber: order.orderNumber, orderId: order.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
