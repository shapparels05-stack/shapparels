import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { specialOffers, specialOfferItems } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { specialOfferSchema } from "@/lib/validators/special-offer";
import { normalizeSlug } from "@/lib/slug";

function refresh(slug?: string | null) {
  revalidatePath("/special-offers");
  revalidatePath("/");
  if (slug) revalidatePath(`/special-offers/${slug}`);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const parsed = specialOfferSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Validation failed" },
      { status: 400 }
    );
  }
  const data = parsed.data;

  try {
    const [updated] = await db
      .update(specialOffers)
      .set({
        code: data.code,
        name: data.name,
        slug: normalizeSlug(data.slug || data.name),
        description: data.description ?? null,
        price: data.price.toString(),
        images: data.images,
        saleEndsAt: data.saleEndsAt ?? null,
        saleRepeatHours: data.saleRepeatHours ?? null,
        isActive: data.isActive,
        sortOrder: data.sortOrder,
      })
      .where(eq(specialOffers.id, id))
      .returning();

    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Replace the bundle's product set.
    await db.delete(specialOfferItems).where(eq(specialOfferItems.offerId, id));
    await db.insert(specialOfferItems).values(
      data.items.map((it, i) => ({
        offerId: id,
        productId: it.productId,
        variantId: it.variantId ?? null,
        sortOrder: i,
      }))
    );

    refresh(updated.slug);
    return NextResponse.json(updated);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("duplicate") || msg.includes("unique")) {
      return NextResponse.json({ error: "That code or slug is already in use." }, { status: 409 });
    }
    console.error("Update special offer error:", e);
    return NextResponse.json({ error: "Failed to update offer" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await db.delete(specialOffers).where(eq(specialOffers.id, id)); // cascades to items
  refresh();
  return NextResponse.json({ ok: true });
}
