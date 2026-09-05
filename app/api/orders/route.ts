import { NextRequest, NextResponse, after } from "next/server";
import { createOrder, generateOrderNumber, getOrders } from "@/lib/db/queries/orders";
import { checkoutFormSchema } from "@/lib/validators/checkout";
import { db } from "@/lib/db";
import { products, productVariants, specialOffers, specialOfferItems } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { CURRENCY, DEFAULT_COUNTRY } from "@/lib/constants";
import { computeShipping } from "@/lib/shipping";
import { sendCapiEvents, capiContextFromRequest, buildMatchCookie, testCodeFromRequest } from "@/lib/meta-capi";
import { sendOrderPlacedEmails } from "@/lib/email";
import { sendOrderPlacedWhatsApp } from "@/lib/whatsapp";

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
    let hasFreeShipping = false;
    const orderItems: {
      productId: string | null;
      productName: string;
      productSlug: string;
      productImage: string | null;
      variantId: string | null;
      variantLabel: string | null;
      price: string;
      quantity: number;
      total: string;
      bundleProductIds?: { productId: string; variantId: string | null }[];
    }[] = [];

    for (const item of items) {
      let verifiedPrice: number;

      // Bundle / special-offer line: verify the offer, atomically deduct each
      // component product's stock (rolling back on a mid-bundle shortfall), and
      // record a single combined line item.
      if (item.offerId) {
        const [offer] = await db
          .select()
          .from(specialOffers)
          .where(and(eq(specialOffers.id, item.offerId), eq(specialOffers.isActive, true))!)
          .limit(1);
        if (!offer) {
          return NextResponse.json(
            { error: `"${item.productName}" is no longer available.` },
            { status: 400 }
          );
        }
        if (offer.freeShipping) hasFreeShipping = true;

        const comps = await db
          .select({
            productId: specialOfferItems.productId,
            variantId: specialOfferItems.variantId,
            name: products.name,
          })
          .from(specialOfferItems)
          .innerJoin(products, eq(products.id, specialOfferItems.productId))
          .where(eq(specialOfferItems.offerId, offer.id));
        if (comps.length === 0) {
          return NextResponse.json(
            { error: `"${offer.name}" is not available right now.` },
            { status: 400 }
          );
        }

        // For each component: deduct from a variant when the product has any
        // (keeping the product's total in sync), else from the product stock.
        const deducted: { productId: string; variantId: string | null }[] = [];
        const rollback = async () => {
          for (const d of deducted) {
            if (d.variantId) {
              await db
                .update(productVariants)
                .set({ stock: sql`${productVariants.stock} + ${item.quantity}` })
                .where(eq(productVariants.id, d.variantId));
            }
            await db
              .update(products)
              .set({ stock: sql`${products.stock} + ${item.quantity}` })
              .where(eq(products.id, d.productId));
          }
        };
        const outOfStock = async (name: string) => {
          await rollback();
          return NextResponse.json(
            { error: `Sorry, "${name}" in the ${offer.name} offer is out of stock.` },
            { status: 409 }
          );
        };

        for (const c of comps) {
          if (c.variantId) {
            // Deduct the exact variant the admin put in the bundle, atomically,
            // and keep the product total in sync.
            const [ok] = await db
              .update(productVariants)
              .set({ stock: sql`${productVariants.stock} - ${item.quantity}` })
              .where(and(eq(productVariants.id, c.variantId), sql`${productVariants.stock} >= ${item.quantity}`)!)
              .returning();
            if (!ok) return outOfStock(c.name);
            await db
              .update(products)
              .set({ stock: sql`${products.stock} - ${item.quantity}` })
              .where(eq(products.id, c.productId));
            deducted.push({ productId: c.productId, variantId: c.variantId });
          } else {
            const [ok] = await db
              .update(products)
              .set({ stock: sql`${products.stock} - ${item.quantity}` })
              .where(and(eq(products.id, c.productId), sql`${products.stock} >= ${item.quantity}`)!)
              .returning();
            if (!ok) return outOfStock(c.name);
            deducted.push({ productId: c.productId, variantId: null });
          }
        }

        verifiedPrice = parseFloat(offer.price);
        const lineTotal = verifiedPrice * item.quantity;
        subtotal += lineTotal;
        orderItems.push({
          productId: null,
          productName: `${offer.code} - ${offer.name}`,
          productSlug: offer.slug,
          productImage: (offer.images && offer.images[0]) || item.productImage || null,
          variantId: null,
          variantLabel: `Bundle: ${comps.map((c) => c.name).join(", ")}`,
          price: verifiedPrice.toFixed(2),
          quantity: item.quantity,
          total: lineTotal.toFixed(2),
          bundleProductIds: deducted,
        });
        continue;
      }

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
        // Keep the parent product's total stock in sync with its variants.
        const [prod] = await db
          .update(products)
          .set({ stock: sql`${products.stock} - ${item.quantity}` })
          .where(eq(products.id, updated.productId))
          .returning();
        if (prod?.freeShipping) hasFreeShipping = true;
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
        if (updated.freeShipping) hasFreeShipping = true;
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

    const shippingCost = computeShipping(subtotal, hasFreeShipping);
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
    // Sent via after() so it never delays the order response, but Vercel still
    // keeps the function alive until it completes — a plain fire-and-forget
    // gets killed when the function freezes and the event never reaches Meta.
    const [firstName, ...rest] = parsed.data.customerName.trim().split(/\s+/);

    // Product ids for Meta matching: real products only; bundle lines expand
    // into their component products (bundle/offer ids aren't in the catalog).
    const purchaseContents: { id: string; quantity: number; item_price: number }[] = [];
    for (const i of orderItems) {
      if (i.productId) {
        purchaseContents.push({ id: i.productId, quantity: i.quantity, item_price: Number(i.price) });
      } else if (i.bundleProductIds) {
        for (const c of i.bundleProductIds) {
          purchaseContents.push({ id: c.productId, quantity: i.quantity, item_price: 0 });
        }
      }
    }

    after(() => sendCapiEvents([
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
          state: parsed.data.shippingState || null,
          zip: parsed.data.shippingZipCode || null,
          country: DEFAULT_COUNTRY,
        },
        customData: {
          currency: CURRENCY,
          value: Number(total.toFixed(2)),
          content_type: "product",
          // Report real product ids only (matching the catalog). Bundle lines
          // have no single product id, so expand them into their components.
          contents: purchaseContents,
          content_ids: purchaseContents.map((c) => c.id),
          num_items: orderItems.reduce((s, i) => s + i.quantity, 0),
        },
      },
    ], testCodeFromRequest(request)).catch(() => {}));

    // Notify the customer (email if provided + WhatsApp) and the store.
    // Both helpers swallow their own errors, so a notification hiccup can't
    // break the order; awaited so they complete before the function suspends.
    const notificationOrder = {
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      shippingAddress: order.shippingAddress,
      shippingCity: order.shippingCity,
      shippingState: order.shippingState,
      shippingZipCode: order.shippingZipCode,
      shippingCountry: order.shippingCountry,
      subtotal: order.subtotal,
      shippingCost: order.shippingCost,
      total: order.total,
      notes: order.notes,
      items: orderItems.map((i) => ({
        productName: i.productName,
        variantLabel: i.variantLabel,
        quantity: i.quantity,
        price: i.price,
        total: i.total,
      })),
    };
    await Promise.all([
      sendOrderPlacedEmails(notificationOrder),
      sendOrderPlacedWhatsApp(notificationOrder),
    ]);

    const response = NextResponse.json(
      { orderNumber: order.orderNumber, orderId: order.id },
      { status: 201 }
    );
    // Remember HASHED match keys so this browser's future ViewContent /
    // AddToCart / InitiateCheckout mirrors carry PII match keys for Meta
    // (fixes "missing user_data parameters"). Hashes only, never plaintext.
    response.cookies.set("mua", buildMatchCookie({
      email: parsed.data.customerEmail,
      phone: parsed.data.customerPhone,
      firstName: firstName || null,
      lastName: rest.join(" ") || null,
      city: parsed.data.shippingCity,
    }), {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 180,
    });
    return response;
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
