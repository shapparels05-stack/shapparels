import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { specialOffers, specialOfferItems } from "@/lib/db/schema";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { specialOfferSchema } from "@/lib/validators/special-offer";
import { normalizeSlug } from "@/lib/slug";
import { getAllSpecialOffers } from "@/lib/db/queries/special-offers";

function refresh() {
  revalidatePath("/special-offers");
  revalidatePath("/");
}

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await getAllSpecialOffers());
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = specialOfferSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Validation failed" },
      { status: 400 }
    );
  }
  const data = parsed.data;

  try {
    const [offer] = await db
      .insert(specialOffers)
      .values({
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
      .returning();

    await db.insert(specialOfferItems).values(
      data.items.map((it, i) => ({
        offerId: offer.id,
        productId: it.productId,
        variantId: it.variantId ?? null,
        sortOrder: i,
      }))
    );

    refresh();
    return NextResponse.json({ id: offer.id }, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("duplicate") || msg.includes("unique")) {
      return NextResponse.json({ error: "That code or slug is already in use." }, { status: 409 });
    }
    console.error("Create special offer error:", e);
    return NextResponse.json({ error: "Failed to create offer" }, { status: 500 });
  }
}
