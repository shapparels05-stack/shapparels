import { db } from "@/lib/db";
import { orders, orderItems, products, productImages } from "@/lib/db/schema";
import { eq, desc, ne, inArray } from "drizzle-orm";

export interface SocialProofItem {
  id: string;
  name: string; // first name only — never expose full name/phone
  city: string;
  productName: string;
  productImage: string | null;
  slug: string;
  timeAgo: string;
}

// How many items to feed the rotation. Real orders fill this first; only the
// shortfall is padded with curated entries. Once you have this many real
// recent orders, no fabricated items are shown at all.
const TARGET = 16;

// Curated padding used only while there aren't enough real orders yet.
// To turn off fake activity entirely later, set TARGET to 0 (or delete the
// fallback block in getSocialProofItems).
const FALLBACK_NAMES = [
  "Ayesha", "Fatima", "Zainab", "Hira", "Sana", "Mariam", "Iqra", "Areeba",
  "Maha", "Noor", "Amna", "Bushra", "Saba", "Rabia", "Komal", "Nimra",
  "Aliza", "Eman", "Laiba", "Mahnoor", "Aiman", "Sidra", "Zoya", "Kiran",
  "Ali", "Ahmed", "Bilal", "Hamza", "Usman", "Hassan",
];

const FALLBACK_CITIES = [
  "Lahore", "Karachi", "Islamabad", "Rawalpindi", "Faisalabad", "Multan",
  "Peshawar", "Sialkot", "Gujranwala", "Hyderabad", "Bahawalpur", "Sargodha",
  "Abbottabad", "Sahiwal", "Quetta",
];

const FALLBACK_TIMES = [
  "just now", "2 minutes ago", "5 minutes ago", "11 minutes ago",
  "18 minutes ago", "26 minutes ago", "39 minutes ago", "an hour ago",
  "2 hours ago", "3 hours ago", "5 hours ago", "yesterday",
];

function firstName(full: string) {
  return full.trim().split(/\s+/)[0] || full;
}

function timeAgoFrom(date: Date) {
  const mins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const days = Math.floor(hrs / 24);
  return days === 1 ? "yesterday" : `${days} days ago`;
}

function pick<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function getSocialProofItems(): Promise<SocialProofItem[]> {
  // 1. Real recent orders — one entry per order, non-cancelled, newest first.
  const rows = await db
    .select({
      orderId: orders.id,
      customerName: orders.customerName,
      city: orders.shippingCity,
      createdAt: orders.createdAt,
      productName: orderItems.productName,
      slug: orderItems.productSlug,
      productImage: orderItems.productImage,
    })
    .from(orders)
    .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
    .where(ne(orders.status, "cancelled"))
    .orderBy(desc(orders.createdAt))
    .limit(TARGET * 3);

  const seen = new Set<string>();
  const real: SocialProofItem[] = [];
  for (const r of rows) {
    if (seen.has(r.orderId)) continue;
    seen.add(r.orderId);
    real.push({
      id: `real-${r.orderId}`,
      name: firstName(r.customerName),
      city: r.city,
      productName: r.productName,
      productImage: r.productImage,
      slug: r.slug,
      timeAgo: timeAgoFrom(r.createdAt),
    });
    if (real.length >= TARGET) break;
  }

  if (real.length >= TARGET) return real;

  // 2. Pad the shortfall with curated buyers paired to REAL products, so every
  //    popup still links to a real item in the catalog.
  const need = TARGET - real.length;
  const catalog = await db
    .select({ id: products.id, name: products.name, slug: products.slug })
    .from(products)
    .where(eq(products.isActive, true))
    .orderBy(desc(products.createdAt))
    .limit(40);

  if (catalog.length === 0) return real;

  const imgs = await db
    .select({ productId: productImages.productId, url: productImages.url })
    .from(productImages)
    .where(inArray(productImages.productId, catalog.map((p) => p.id)))
    .orderBy(productImages.sortOrder);
  const imageByProduct = new Map<string, string>();
  for (const img of imgs) {
    if (!imageByProduct.has(img.productId)) imageByProduct.set(img.productId, img.url);
  }

  const fake: SocialProofItem[] = [];
  for (let i = 0; i < need; i++) {
    const product = pick(catalog);
    fake.push({
      id: `fb-${i}`,
      name: pick(FALLBACK_NAMES),
      city: pick(FALLBACK_CITIES),
      productName: product.name,
      productImage: imageByProduct.get(product.id) ?? null,
      slug: product.slug,
      timeAgo: pick(FALLBACK_TIMES),
    });
  }

  return [...real, ...fake];
}
