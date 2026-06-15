import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products, productImages, categories, productVariants } from "@/lib/db/schema";
import { eq, and, or, ilike, desc, sql, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";

const PAGE_SIZE = 20;

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sp = request.nextUrl.searchParams;
  const q = (sp.get("q") || "").trim();
  const status = sp.get("status") || "all";
  const categoryIds = (sp.get("categories") || "").split(",").map((s) => s.trim()).filter(Boolean);
  const page = Math.max(1, Number(sp.get("page")) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const conditions = [];
  if (q) {
    // Search by product name OR product code.
    conditions.push(or(ilike(products.name, `%${q}%`), ilike(products.code, `%${q}%`))!);
  }
  if (status === "active") conditions.push(eq(products.isActive, true));
  else if (status === "archived") conditions.push(eq(products.isActive, false));
  if (categoryIds.length > 0) conditions.push(inArray(products.categoryId, categoryIds));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      code: products.code,
      slug: products.slug,
      basePrice: products.basePrice,
      stock: products.stock,
      isActive: products.isActive,
      isFeatured: products.isFeatured,
      categoryName: categories.name,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(where)
    .orderBy(desc(products.createdAt))
    .limit(PAGE_SIZE + 1) // one extra to detect "hasMore"
    .offset(offset);

  const hasMore = rows.length > PAGE_SIZE;
  const pageRows = hasMore ? rows.slice(0, PAGE_SIZE) : rows;
  const ids = pageRows.map((p) => p.id);

  const [images, stocks] = await Promise.all([
    ids.length
      ? db
          .select({ productId: productImages.productId, url: productImages.url })
          .from(productImages)
          .where(inArray(productImages.productId, ids))
          .orderBy(productImages.sortOrder)
      : Promise.resolve([]),
    ids.length
      ? db
          .select({
            productId: productVariants.productId,
            totalStock: sql<number>`COALESCE(SUM(${productVariants.stock}), 0)`,
          })
          .from(productVariants)
          .where(inArray(productVariants.productId, ids))
          .groupBy(productVariants.productId)
      : Promise.resolve([]),
  ]);

  const imageByProduct = new Map<string, string>();
  for (const img of images) if (!imageByProduct.has(img.productId)) imageByProduct.set(img.productId, img.url);
  const stockByProduct = new Map<string, number>();
  for (const s of stocks) stockByProduct.set(s.productId, Number(s.totalStock));

  const items = pageRows.map((p) => ({
    ...p,
    image: imageByProduct.get(p.id) || null,
    totalStock: stockByProduct.has(p.id) ? stockByProduct.get(p.id)! : p.stock,
  }));

  return NextResponse.json({ items, hasMore, page });
}
