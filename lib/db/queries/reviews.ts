import { db } from "@/lib/db";
import { reviews, products } from "@/lib/db/schema";
import { eq, and, desc, sql, inArray } from "drizzle-orm";

export type RatingSummary = { average: number; count: number };

export async function createReview(data: {
  productId: string;
  rating: number;
  title?: string;
  body: string;
  authorName: string;
  authorEmail?: string;
}) {
  const [review] = await db
    .insert(reviews)
    .values({
      productId: data.productId,
      rating: data.rating,
      title: data.title || null,
      body: data.body,
      authorName: data.authorName,
      authorEmail: data.authorEmail || null,
      // status defaults to "pending"
    })
    .returning();
  return review;
}

// Public: approved reviews for a single product, paginated.
export async function getApprovedReviews(
  productId: string,
  options: { page?: number; limit?: number } = {}
) {
  const { page = 1, limit = 10 } = options;
  const offset = (page - 1) * limit;
  const where = and(eq(reviews.productId, productId), eq(reviews.status, "approved"));

  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: reviews.id,
        rating: reviews.rating,
        title: reviews.title,
        body: reviews.body,
        authorName: reviews.authorName,
        createdAt: reviews.createdAt,
      })
      .from(reviews)
      .where(where)
      .orderBy(desc(reviews.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(reviews).where(where),
  ]);

  const total = Number(countResult[0]?.count ?? 0);
  return { reviews: rows, total, page, limit, totalPages: Math.ceil(total / limit) };
}

// Average rating + count of approved reviews for one product.
export async function getProductRatingSummary(
  productId: string
): Promise<RatingSummary> {
  const [row] = await db
    .select({
      average: sql<number>`coalesce(avg(${reviews.rating}), 0)`,
      count: sql<number>`count(*)`,
    })
    .from(reviews)
    .where(and(eq(reviews.productId, productId), eq(reviews.status, "approved")));

  return {
    average: Number(row?.average ?? 0),
    count: Number(row?.count ?? 0),
  };
}

// Batch summaries for product listings/cards.
export async function getRatingSummaries(
  productIds: string[]
): Promise<Map<string, RatingSummary>> {
  const map = new Map<string, RatingSummary>();
  if (productIds.length === 0) return map;

  const rows = await db
    .select({
      productId: reviews.productId,
      average: sql<number>`avg(${reviews.rating})`,
      count: sql<number>`count(*)`,
    })
    .from(reviews)
    .where(and(inArray(reviews.productId, productIds), eq(reviews.status, "approved")))
    .groupBy(reviews.productId);

  for (const r of rows) {
    map.set(r.productId, {
      average: Number(r.average ?? 0),
      count: Number(r.count ?? 0),
    });
  }
  return map;
}

// Admin: list reviews, optionally filtered by status, with product name.
export async function getReviews(
  options: { status?: string; page?: number; limit?: number } = {}
) {
  const { status, page = 1, limit = 20 } = options;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (status && status !== "all") {
    conditions.push(eq(reviews.status, status));
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: reviews.id,
        productId: reviews.productId,
        productName: products.name,
        productSlug: products.slug,
        rating: reviews.rating,
        title: reviews.title,
        body: reviews.body,
        authorName: reviews.authorName,
        authorEmail: reviews.authorEmail,
        status: reviews.status,
        createdAt: reviews.createdAt,
      })
      .from(reviews)
      .leftJoin(products, eq(reviews.productId, products.id))
      .where(where)
      .orderBy(desc(reviews.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(reviews).where(where),
  ]);

  const total = Number(countResult[0]?.count ?? 0);
  return { reviews: rows, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function updateReviewStatus(id: string, status: string) {
  const [updated] = await db
    .update(reviews)
    .set({ status })
    .where(eq(reviews.id, id))
    .returning();
  return updated;
}

export async function deleteReview(id: string) {
  await db.delete(reviews).where(eq(reviews.id, id));
}

export async function getPendingReviewCount() {
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(reviews)
    .where(eq(reviews.status, "pending"));
  return Number(row?.count ?? 0);
}
