import { db } from "@/lib/db";
import {
  products,
  productImages,
  productVariants,
  productOptionTypes,
  productOptionValues,
  categories,
  orders,
  orderItems,
} from "@/lib/db/schema";
import { eq, ne, and, desc, asc, ilike, or, sql, inArray } from "drizzle-orm";
import { getRatingSummaries } from "@/lib/db/queries/reviews";

// Columns shared by the homepage product carousels.
const homeProductColumns = {
  id: products.id,
  name: products.name,
  slug: products.slug,
  basePrice: products.basePrice,
  compareAtPrice: products.compareAtPrice,
  saleEndsAt: products.saleEndsAt,
  stock: products.stock,
  isFeatured: products.isFeatured,
  categoryName: categories.name,
};

type HomeProductRow = {
  id: string;
  name: string;
  slug: string;
  basePrice: string;
  compareAtPrice: string | null;
  saleEndsAt: Date | null;
  stock: number;
  isFeatured: boolean;
  categoryName: string | null;
};

// Attach images (first two) and rating summaries to a set of product rows.
async function hydrateProducts(rows: HomeProductRow[]) {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const [images, ratings] = await Promise.all([
    db
      .select({
        productId: productImages.productId,
        url: productImages.url,
        alt: productImages.alt,
      })
      .from(productImages)
      .where(inArray(productImages.productId, ids))
      .orderBy(productImages.sortOrder),
    getRatingSummaries(ids),
  ]);

  const imagesByProduct = new Map<string, { url: string; alt: string | null }[]>();
  for (const img of images) {
    const existing = imagesByProduct.get(img.productId) || [];
    existing.push({ url: img.url, alt: img.alt });
    imagesByProduct.set(img.productId, existing);
  }

  return rows.map((p) => ({
    ...p,
    images: imagesByProduct.get(p.id) || [],
    ratingAverage: ratings.get(p.id)?.average ?? 0,
    ratingCount: ratings.get(p.id)?.count ?? 0,
  }));
}

// Newest active products.
export async function getNewArrivals(limit = 8) {
  const rows = await db
    .select(homeProductColumns)
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.isActive, true))
    .orderBy(desc(products.createdAt))
    .limit(limit);
  return hydrateProducts(rows);
}

// Best sellers: admin-flagged products first (isBestSeller), then topped up by
// real units sold across non-cancelled orders, then featured/newest — so the
// section reflects manual picks but never renders empty.
export async function getBestSellers(limit = 8) {
  // 1. Manually flagged best sellers, newest first.
  const flaggedRows = await db
    .select(homeProductColumns)
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(and(eq(products.isActive, true), eq(products.isBestSeller, true)))
    .orderBy(desc(products.createdAt))
    .limit(limit);

  let bestRows: HomeProductRow[] = [...flaggedRows];
  if (bestRows.length >= limit) {
    return hydrateProducts(bestRows.slice(0, limit));
  }

  const flaggedIds = new Set(bestRows.map((r) => r.id));

  // 2. Top up with real top sellers by units sold (excluding already-included).
  const ranked = await db
    .select({
      productId: orderItems.productId,
      sold: sql<number>`sum(${orderItems.quantity})`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(and(sql`${orderItems.productId} is not null`, ne(orders.status, "cancelled")))
    .groupBy(orderItems.productId)
    .orderBy(desc(sql`sum(${orderItems.quantity})`))
    .limit(limit);

  const rankedIds = ranked
    .map((r) => r.productId)
    .filter((id): id is string => id !== null && !flaggedIds.has(id));

  if (rankedIds.length > 0) {
    const rows = await db
      .select(homeProductColumns)
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(and(eq(products.isActive, true), inArray(products.id, rankedIds)));
    const byId = new Map(rows.map((r) => [r.id, r]));
    // Append in sales-ranking order, after the flagged picks.
    for (const id of rankedIds) {
      if (bestRows.length >= limit) break;
      const row = byId.get(id);
      if (row) bestRows.push(row);
    }
  }

  if (bestRows.length < limit) {
    const have = new Set(bestRows.map((r) => r.id));
    const fillRows = await db
      .select(homeProductColumns)
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(products.isActive, true))
      .orderBy(desc(products.isFeatured), desc(products.createdAt))
      .limit(limit * 2);
    for (const row of fillRows) {
      if (bestRows.length >= limit) break;
      if (!have.has(row.id)) {
        bestRows.push(row);
        have.add(row.id);
      }
    }
  }

  return hydrateProducts(bestRows);
}

// Active limited-time offers: discounted, in stock, with a deadline still in
// the future. Ordered by soonest-ending first to maximise urgency.
export async function getLimitedTimeDeals(limit = 8) {
  const rows = await db
    .select(homeProductColumns)
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(
      and(
        eq(products.isActive, true),
        sql`${products.saleEndsAt} is not null`,
        sql`${products.saleEndsAt} > now()`,
        sql`${products.compareAtPrice} is not null`,
        sql`CAST(${products.compareAtPrice} AS DECIMAL) > CAST(${products.basePrice} AS DECIMAL)`
      )
    )
    .orderBy(asc(products.saleEndsAt))
    .limit(limit);
  return hydrateProducts(rows);
}

export type ProductListItem = {
  id: string;
  name: string;
  code: string | null;
  slug: string;
  basePrice: string;
  compareAtPrice: string | null;
  saleEndsAt: Date | null;
  stock: number;
  isFeatured: boolean;
  categoryName: string | null;
  images: { url: string; alt: string | null }[];
  ratingAverage: number;
  ratingCount: number;
};

interface GetProductsOptions {
  categoryId?: string;
  categoryIds?: string[];
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: "price-asc" | "price-desc" | "newest" | "name";
  page?: number;
  limit?: number;
  featured?: boolean;
}

export async function getProducts(options: GetProductsOptions = {}) {
  const { page = 1, limit = 12, sortBy = "newest" } = options;
  const offset = (page - 1) * limit;

  const conditions = [eq(products.isActive, true)];

  if (options.categoryIds && options.categoryIds.length > 0) {
    conditions.push(inArray(products.categoryId, options.categoryIds));
  } else if (options.categoryId) {
    conditions.push(eq(products.categoryId, options.categoryId));
  }

  if (options.search) {
    conditions.push(
      or(
        ilike(products.name, `%${options.search}%`),
        ilike(products.description, `%${options.search}%`)
      )!
    );
  }

  if (options.minPrice !== undefined) {
    conditions.push(sql`CAST(${products.basePrice} AS DECIMAL) >= ${options.minPrice}`);
  }

  if (options.maxPrice !== undefined) {
    conditions.push(sql`CAST(${products.basePrice} AS DECIMAL) <= ${options.maxPrice}`);
  }

  if (options.featured) {
    conditions.push(eq(products.isFeatured, true));
  }

  const orderBy = (() => {
    switch (sortBy) {
      case "price-asc":
        return asc(sql`CAST(${products.basePrice} AS DECIMAL)`);
      case "price-desc":
        return desc(sql`CAST(${products.basePrice} AS DECIMAL)`);
      case "name":
        return asc(products.name);
      case "newest":
      default:
        return desc(products.createdAt);
    }
  })();

  const [productList, countResult] = await Promise.all([
    db
      .select({
        id: products.id,
        name: products.name,
        code: products.code,
        slug: products.slug,
        basePrice: products.basePrice,
        compareAtPrice: products.compareAtPrice,
        saleEndsAt: products.saleEndsAt,
        stock: products.stock,
        isFeatured: products.isFeatured,
        categoryName: categories.name,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(and(...conditions))
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(and(...conditions)),
  ]);

  // Fetch images for products
  const productIds = productList.map((p) => p.id);
  const images =
    productIds.length > 0
      ? await db
          .select({
            productId: productImages.productId,
            url: productImages.url,
            alt: productImages.alt,
          })
          .from(productImages)
          .where(inArray(productImages.productId, productIds))
          .orderBy(productImages.sortOrder)
      : [];

  const imagesByProduct = new Map<string, { url: string; alt: string | null }[]>();
  for (const img of images) {
    const existing = imagesByProduct.get(img.productId) || [];
    existing.push({ url: img.url, alt: img.alt });
    imagesByProduct.set(img.productId, existing);
  }

  const ratings = await getRatingSummaries(productIds);

  const productsWithImages: ProductListItem[] = productList.map((p) => ({
    ...p,
    images: imagesByProduct.get(p.id) || [],
    ratingAverage: ratings.get(p.id)?.average ?? 0,
    ratingCount: ratings.get(p.id)?.count ?? 0,
  }));

  return {
    products: productsWithImages,
    total: Number(countResult[0]?.count ?? 0),
    page,
    limit,
    totalPages: Math.ceil(Number(countResult[0]?.count ?? 0) / limit),
  };
}

export async function getProductBySlug(slug: string) {
  const [product] = await db
    .select()
    .from(products)
    .where(and(eq(products.slug, slug), eq(products.isActive, true)))
    .limit(1);

  if (!product) return null;

  const [images, optionTypes, variants, category] = await Promise.all([
    db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, product.id))
      .orderBy(productImages.sortOrder),
    db
      .select()
      .from(productOptionTypes)
      .where(eq(productOptionTypes.productId, product.id))
      .orderBy(productOptionTypes.sortOrder),
    db
      .select()
      .from(productVariants)
      .where(and(eq(productVariants.productId, product.id), eq(productVariants.isActive, true)))
      .orderBy(productVariants.createdAt),
    product.categoryId
      ? db.select().from(categories).where(eq(categories.id, product.categoryId)).limit(1)
      : Promise.resolve([]),
  ]);

  // Fetch option values for each option type
  const optionTypesWithValues = await Promise.all(
    optionTypes.map(async (ot) => {
      const values = await db
        .select()
        .from(productOptionValues)
        .where(eq(productOptionValues.optionTypeId, ot.id))
        .orderBy(productOptionValues.sortOrder);
      return { ...ot, values };
    })
  );

  return {
    ...product,
    images,
    optionTypes: optionTypesWithValues,
    variants,
    category: category[0] || null,
  };
}

export async function getRelatedProducts(productId: string, categoryId: string | null, limit = 4) {
  const conditions = [eq(products.isActive, true), sql`${products.id} != ${productId}`];

  if (categoryId) {
    conditions.push(eq(products.categoryId, categoryId));
  }

  const related = await db
    .select({
      id: products.id,
      name: products.name,
      code: products.code,
      slug: products.slug,
      basePrice: products.basePrice,
      compareAtPrice: products.compareAtPrice,
      saleEndsAt: products.saleEndsAt,
      stock: products.stock,
      isFeatured: products.isFeatured,
      categoryName: categories.name,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(and(...conditions))
    .orderBy(desc(products.createdAt))
    .limit(limit);

  const productIds = related.map((p) => p.id);
  const images =
    productIds.length > 0
      ? await db
          .select({
            productId: productImages.productId,
            url: productImages.url,
            alt: productImages.alt,
          })
          .from(productImages)
          .where(inArray(productImages.productId, productIds))
          .orderBy(productImages.sortOrder)
      : [];

  const imagesByProduct = new Map<string, { url: string; alt: string | null }[]>();
  for (const img of images) {
    const existing = imagesByProduct.get(img.productId) || [];
    existing.push({ url: img.url, alt: img.alt });
    imagesByProduct.set(img.productId, existing);
  }

  const ratings = await getRatingSummaries(productIds);

  return related.map((p) => ({
    ...p,
    images: imagesByProduct.get(p.id) || [],
    ratingAverage: ratings.get(p.id)?.average ?? 0,
    ratingCount: ratings.get(p.id)?.count ?? 0,
  }));
}
