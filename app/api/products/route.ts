import { NextRequest, NextResponse } from "next/server";
import { getProducts } from "@/lib/db/queries/products";
import { db } from "@/lib/db";
import { products, productImages, productOptionTypes, productOptionValues, productVariants } from "@/lib/db/schema";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { productCreateSchema } from "@/lib/validators/product";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const result = await getProducts({
    categoryId: searchParams.get("category") || undefined,
    search: searchParams.get("search") || undefined,
    minPrice: searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined,
    maxPrice: searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined,
    sortBy: (searchParams.get("sort") as any) || "newest",
    page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
    limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : 12,
  });

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = productCreateSchema.parse(body);

    const [product] = await db
      .insert(products)
      .values({
        name: parsed.name,
        code: parsed.code ?? null,
        slug: parsed.slug,
        description: parsed.description,
        shortDescription: parsed.shortDescription,
        basePrice: parsed.basePrice.toString(),
        compareAtPrice: parsed.compareAtPrice?.toString() ?? null,
        saleEndsAt: parsed.saleEndsAt ?? null,
        categoryId: parsed.categoryId ?? null,
        metaTitle: parsed.metaTitle,
        metaDescription: parsed.metaDescription,
        stock: parsed.stock,
        isFeatured: parsed.isFeatured,
        isBestSeller: parsed.isBestSeller,
        bestSellerVariantId: parsed.bestSellerVariantId ?? null,
        isActive: parsed.isActive,
        tags: parsed.tags,
      })
      .returning();

    // Insert images (accepts plain URL strings or { url, optionValue } objects).
    if (body.images && body.images.length > 0) {
      await db.insert(productImages).values(
        body.images.map((img: string | { url: string; optionValue?: string | null }, index: number) => ({
          productId: product.id,
          url: typeof img === "string" ? img : img.url,
          alt: parsed.name,
          optionValue: typeof img === "string" ? null : img.optionValue || null,
          sortOrder: index,
        }))
      );
    }

    // Insert option types and values, build label->id map for variants
    const labelToValueId = new Map<string, string>();

    if (body.optionTypes && body.optionTypes.length > 0) {
      for (let i = 0; i < body.optionTypes.length; i++) {
        const ot = body.optionTypes[i];
        if (!ot.name) continue;
        const [insertedType] = await db
          .insert(productOptionTypes)
          .values({ productId: product.id, name: ot.name, sortOrder: i })
          .returning();

        const validValues = (ot.values || []).filter((v: string) => v.trim());
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

    // Insert variants with resolved optionValueIds
    if (body.variants && body.variants.length > 0) {
      await db.insert(productVariants).values(
        body.variants.map((v: any) => ({
          productId: product.id,
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

    // New product affects the homepage product sections + listing.
    revalidatePath("/");
    revalidatePath("/products");
    if (product.slug) revalidatePath(`/products/${product.slug}`);

    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("Product create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
