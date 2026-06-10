import { db } from "@/lib/db";
import { banners } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";

// Active slides for the public homepage carousel, in display order.
export async function getActiveBanners() {
  return db
    .select()
    .from(banners)
    .where(eq(banners.isActive, true))
    .orderBy(asc(banners.sortOrder), asc(banners.createdAt));
}

// All slides (active or not) for the admin panel.
export async function getAllBanners() {
  return db
    .select()
    .from(banners)
    .orderBy(asc(banners.sortOrder), asc(banners.createdAt));
}
