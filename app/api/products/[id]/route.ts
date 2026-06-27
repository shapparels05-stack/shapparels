import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products, productImages, productOptionTypes, productOptionValues, productVariants } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

// Refresh the static homepage + listing and the product's own (ISR-cached)
// detail page after a change, so edits show up immediately.
function revalidateProduct(slug?: string | null) {
  revalidatePath("/");
  revalidatePath("/products");
  if (slug) revalidatePath(`/products/${slug}`);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const [product] = await db.select().from(products).where(eq(products.id, id)).limit(1);

  if (!product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(product);
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

  try {
    const body = await request.json();

    // Update product
    const [updated] = await db
      .update(products)
      .set({
        name: body.name,
        code: body.code ?? null,
        slug: body.slug,
        description: body.description,
        shortDescription: body.shortDescription,
        basePrice: body.basePrice?.toString(),
        compareAtPrice: body.compareAtPrice?.toString() ?? null,
        saleEndsAt: body.saleEndsAt ? new Date(body.saleEndsAt) : null,
        saleRepeatHours: body.saleRepeatHours ? Number(body.saleRepeatHours) : null,
        categoryId: body.categoryId || null,
        metaTitle: body.metaTitle,
        metaDescription: body.metaDescription,
        stock: body.stock,
        isFeatured: body.isFeatured,
        isBestSeller: body.isBestSeller,
        bestSellerVariantId: body.bestSellerVariantId || null,
        isActive: body.isActive,
        tags: body.tags,
      })
      .where(eq(products.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Replace images
    if (body.images) {
      await db.delete(productImages).where(eq(productImages.productId, id));
      if (body.images.length > 0) {
        await db.insert(productImages).values(
          body.images.map((img: string | { url: string; optionValue?: string | null }, index: number) => ({
            productId: id,
            url: typeof img === "string" ? img : img.url,
            alt: body.name,
            optionValue: typeof img === "string" ? null : img.optionValue || null,
            sortOrder: index,
          }))
        );
      }
    }

    // Replace option types and values, build label->id map for variants
    const labelToValueId = new Map<string, string>();

    if (body.optionTypes) {
      await db.delete(productOptionTypes).where(eq(productOptionTypes.productId, id));
      for (let i = 0; i < body.optionTypes.length; i++) {
        const ot = body.optionTypes[i];
        if (!ot.name) continue;
        const [insertedType] = await db
          .insert(productOptionTypes)
          .values({ productId: id, name: ot.name, sortOrder: i })
          .returning();

        const validValues = ot.values.filter((v: string) => v.trim());
        if (validValues.length > 0) {
          const insertedValues = await db.insert(productOptionValues).values(
            validValues.map((v: string, j: number) => ({
              optionTypeId: insertedType.id,
              value: v,
              sortOrder: j,
            }))
          ).returning();

          for (const iv of insertedValues) {
            labelToValueId.set(`${ot.name}: ${iv.value}`, iv.id);
          }
        }
      }
    }

    // Replace variants with resolved optionValueIds
    if (body.variants) {
      await db.delete(productVariants).where(eq(productVariants.productId, id));
      if (body.variants.length > 0) {
        await db.insert(productVariants).values(
          body.variants.map((v: any) => ({
            productId: id,
            sku: v.sku || null,
            price: v.price.toString(),
            compareAtPrice: v.compareAtPrice?.toString() ?? null,
            stock: v.stock ?? 0,
            optionValueIds: (v.optionValueLabels || [])
              .map((label: string) => labelToValueId.get(label))
              .filter(Boolean),
          }))
        );
      }
    }

    revalidateProduct(updated.slug);
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Product update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Partial update — used by the admin list for quick toggles (archive,
// feature flag) without sending the full product payload like PUT requires.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();

    const updates: { isActive?: boolean; isFeatured?: boolean } = {};
    if (typeof body.isActive === "boolean") updates.isActive = body.isActive;
    if (typeof body.isFeatured === "boolean") updates.isFeatured = body.isFeatured;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const [updated] = await db
      .update(products)
      .set(updates)
      .where(eq(products.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    revalidateProduct(updated.slug);
    return NextResponse.json({ success: true, product: updated });
  } catch (error) {
    console.error("Patch product error:", error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [existing] = await db
    .select({ slug: products.slug })
    .from(products)
    .where(eq(products.id, id))
    .limit(1);

  await db.delete(products).where(eq(products.id, id));

  revalidateProduct(existing?.slug);
  return NextResponse.json({ success: true });
}
