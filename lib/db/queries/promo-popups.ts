import { db } from "@/lib/db";
import { promoPopups } from "@/lib/db/schema";
import { eq, asc, desc } from "drizzle-orm";

// Active popups for the storefront, highest priority first. The client shows
// the first one the visitor hasn't dismissed (per each popup's frequency).
export async function getActivePromoPopups() {
  return db
    .select({
      id: promoPopups.id,
      title: promoPopups.title,
      imageUrl: promoPopups.imageUrl,
      linkUrl: promoPopups.linkUrl,
      frequency: promoPopups.frequency,
    })
    .from(promoPopups)
    .where(eq(promoPopups.isActive, true))
    .orderBy(asc(promoPopups.sortOrder), desc(promoPopups.createdAt));
}

export async function getAllPromoPopups() {
  return db
    .select()
    .from(promoPopups)
    .orderBy(asc(promoPopups.sortOrder), desc(promoPopups.createdAt));
}

export async function getPromoPopupById(id: string) {
  const [row] = await db.select().from(promoPopups).where(eq(promoPopups.id, id)).limit(1);
  return row ?? null;
}
