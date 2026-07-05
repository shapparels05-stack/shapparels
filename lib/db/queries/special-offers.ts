import { db } from "@/lib/db";
import {
  specialOffers,
  specialOfferItems,
  products,
  productImages,
  productVariants,
  productOptionTypes,
  productOptionValues,
} from "@/lib/db/schema";
import { eq, and, asc, desc, inArray } from "drizzle-orm";

export interface OfferProduct {
  id: string;
  name: string;
  slug: string;
  unitPrice: string; // chosen variant price, or product base price
  variantId: string | null;
  variantLabel: string | null;
  image: string | null;
  images: string[];
  inStock: boolean;
}

// Resolve a variant's human label ("Black / M") from its option value ids.
function variantLabel(
  optionValueIds: string[] | null,
  valueMap: Map<string, string>
): string | null {
  const label = (optionValueIds ?? [])
    .map((id) => valueMap.get(id))
    .filter(Boolean)
    .join(" / ");
  return label || null;
}

// Load an offer's products (with the admin-chosen variant), their price, stock,
// label and images.
async function loadOfferProducts(offerId: string): Promise<OfferProduct[]> {
  const rows = await db
    .select({
      productId: products.id,
      name: products.name,
      slug: products.slug,
      basePrice: products.basePrice,
      productStock: products.stock,
      isActive: products.isActive,
      variantId: specialOfferItems.variantId,
    })
    .from(specialOfferItems)
    .innerJoin(products, eq(products.id, specialOfferItems.productId))
    .where(eq(specialOfferItems.offerId, offerId))
    .orderBy(asc(specialOfferItems.sortOrder));

  if (rows.length === 0) return [];

  const productIds = rows.map((r) => r.productId);
  const variantIds = rows.map((r) => r.variantId).filter((v): v is string => Boolean(v));

  const [variantRows, valueRows, imgs] = await Promise.all([
    variantIds.length
      ? db
          .select({
            id: productVariants.id,
            price: productVariants.price,
            stock: productVariants.stock,
            optionValueIds: productVariants.optionValueIds,
          })
          .from(productVariants)
          .where(inArray(productVariants.id, variantIds))
      : Promise.resolve([]),
    db
      .select({ id: productOptionValues.id, value: productOptionValues.value })
      .from(productOptionValues)
      .innerJoin(productOptionTypes, eq(productOptionTypes.id, productOptionValues.optionTypeId))
      .where(inArray(productOptionTypes.productId, productIds)),
    db
      .select({ productId: productImages.productId, url: productImages.url })
      .from(productImages)
      .where(inArray(productImages.productId, productIds))
      .orderBy(asc(productImages.sortOrder)),
  ]);

  const variantMap = new Map(variantRows.map((v) => [v.id, v]));
  const valueMap = new Map(valueRows.map((v) => [v.id, v.value]));
  const imagesByProduct = new Map<string, string[]>();
  for (const im of imgs) {
    const list = imagesByProduct.get(im.productId) ?? [];
    list.push(im.url);
    imagesByProduct.set(im.productId, list);
  }

  return rows.map((r) => {
    const v = r.variantId ? variantMap.get(r.variantId) : null;
    const images = imagesByProduct.get(r.productId) ?? [];
    const stock = v ? v.stock : r.productStock;
    return {
      id: r.productId,
      name: r.name,
      slug: r.slug,
      unitPrice: v ? v.price : r.basePrice,
      variantId: r.variantId ?? null,
      variantLabel: v ? variantLabel(v.optionValueIds, valueMap) : null,
      image: images[0] ?? null,
      images,
      inStock: r.isActive && stock > 0,
    };
  });
}

function summarize(offerPrice: string, offerProducts: OfferProduct[]) {
  const originalPrice = offerProducts.reduce((s, p) => s + parseFloat(p.unitPrice), 0);
  const price = parseFloat(offerPrice);
  const savings = Math.max(0, originalPrice - price);
  const available = offerProducts.length > 0 && offerProducts.every((p) => p.inStock);
  return { originalPrice, price, savings, available };
}

export interface SpecialOfferListItem {
  id: string;
  code: string;
  name: string;
  slug: string;
  price: string;
  image: string | null;
  saleEndsAt: Date | null;
  saleRepeatHours: number | null;
  originalPrice: number;
  savings: number;
  available: boolean;
  productCount: number;
}

type OfferRow = typeof specialOffers.$inferSelect;

async function toListItem(o: OfferRow): Promise<SpecialOfferListItem> {
  const offerProducts = await loadOfferProducts(o.id);
  const { originalPrice, savings, available } = summarize(o.price, offerProducts);
  const image = (o.images && o.images[0]) || offerProducts.find((p) => p.image)?.image || null;
  return {
    id: o.id,
    code: o.code,
    name: o.name,
    slug: o.slug,
    price: o.price,
    image,
    saleEndsAt: o.saleEndsAt,
    saleRepeatHours: o.saleRepeatHours,
    originalPrice,
    savings,
    available,
    productCount: offerProducts.length,
  };
}

export async function getActiveSpecialOffers(): Promise<SpecialOfferListItem[]> {
  const offers = await db
    .select()
    .from(specialOffers)
    .where(eq(specialOffers.isActive, true))
    .orderBy(asc(specialOffers.sortOrder), desc(specialOffers.createdAt));

  return Promise.all(offers.map(toListItem));
}

// Active special offers that include a given product (for cross-sell on the
// product page).
export async function getSpecialOffersForProduct(
  productId: string
): Promise<SpecialOfferListItem[]> {
  const rows = await db
    .select({ offerId: specialOfferItems.offerId })
    .from(specialOfferItems)
    .where(eq(specialOfferItems.productId, productId));

  const offerIds = [...new Set(rows.map((r) => r.offerId))];
  if (offerIds.length === 0) return [];

  const offers = await db
    .select()
    .from(specialOffers)
    .where(and(inArray(specialOffers.id, offerIds), eq(specialOffers.isActive, true)))
    .orderBy(asc(specialOffers.sortOrder), desc(specialOffers.createdAt));

  return Promise.all(offers.map(toListItem));
}

export async function getSpecialOfferBySlug(slug: string) {
  const [offer] = await db
    .select()
    .from(specialOffers)
    .where(and(eq(specialOffers.slug, slug), eq(specialOffers.isActive, true)))
    .limit(1);
  if (!offer) return null;

  const offerProducts = await loadOfferProducts(offer.id);
  const { originalPrice, savings, available } = summarize(offer.price, offerProducts);
  const gallery = [
    ...(offer.images ?? []),
    ...offerProducts.flatMap((p) => p.images),
  ];

  return {
    ...offer,
    products: offerProducts,
    gallery,
    originalPrice,
    savings,
    available,
  };
}

// --- Admin ---
export async function getAllSpecialOffers() {
  const offers = await db
    .select()
    .from(specialOffers)
    .orderBy(asc(specialOffers.sortOrder), desc(specialOffers.createdAt));
  return Promise.all(
    offers.map(async (o) => {
      const offerProducts = await loadOfferProducts(o.id);
      const { originalPrice, savings } = summarize(o.price, offerProducts);
      return { ...o, productCount: offerProducts.length, originalPrice, savings };
    })
  );
}

export async function getSpecialOfferByIdForEdit(id: string) {
  const [offer] = await db.select().from(specialOffers).where(eq(specialOffers.id, id)).limit(1);
  if (!offer) return null;
  const items = await db
    .select({ productId: specialOfferItems.productId, variantId: specialOfferItems.variantId })
    .from(specialOfferItems)
    .where(eq(specialOfferItems.offerId, id))
    .orderBy(asc(specialOfferItems.sortOrder));
  return { ...offer, items };
}

export interface PickerVariant {
  id: string;
  label: string;
  price: string;
  stock: number;
}
export interface PickerProduct {
  id: string;
  name: string;
  code: string | null;
  basePrice: string;
  variants: PickerVariant[];
}

// Active products + their variants, for the admin bundle picker.
export async function getProductsForPicker(): Promise<PickerProduct[]> {
  const prods = await db
    .select({
      id: products.id,
      name: products.name,
      code: products.code,
      basePrice: products.basePrice,
    })
    .from(products)
    .where(eq(products.isActive, true))
    .orderBy(asc(products.name));

  if (prods.length === 0) return [];
  const ids = prods.map((p) => p.id);

  const [variants, values] = await Promise.all([
    db
      .select({
        id: productVariants.id,
        productId: productVariants.productId,
        price: productVariants.price,
        stock: productVariants.stock,
        optionValueIds: productVariants.optionValueIds,
      })
      .from(productVariants)
      .where(and(inArray(productVariants.productId, ids), eq(productVariants.isActive, true))),
    db
      .select({ id: productOptionValues.id, value: productOptionValues.value })
      .from(productOptionValues)
      .innerJoin(productOptionTypes, eq(productOptionTypes.id, productOptionValues.optionTypeId))
      .where(inArray(productOptionTypes.productId, ids)),
  ]);

  const valueMap = new Map(values.map((v) => [v.id, v.value]));
  const byProduct = new Map<string, PickerVariant[]>();
  for (const v of variants) {
    const list = byProduct.get(v.productId) ?? [];
    list.push({
      id: v.id,
      label: variantLabel(v.optionValueIds, valueMap) || "Default",
      price: v.price,
      stock: v.stock,
    });
    byProduct.set(v.productId, list);
  }

  return prods.map((p) => ({ ...p, variants: byProduct.get(p.id) ?? [] }));
}
