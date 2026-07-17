import { pgTable, uuid, text, integer, boolean, timestamp, numeric, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { products, productVariants } from "./products";

// A "special offer" is a bundle: several products sold together under one code,
// name, image set, and price, with an optional limited-time countdown.
export const specialOffers = pgTable("special_offers", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  // The bundle price. The crossed-out "original" is derived from the sum of the
  // included products' base prices at read time.
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  images: jsonb("images").$type<string[]>().default([]),
  saleEndsAt: timestamp("sale_ends_at", { withTimezone: true }),
  saleRepeatHours: integer("sale_repeat_hours"),
  // When true, this bundle ships free (no shipping added to the order total).
  freeShipping: boolean("free_shipping").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const specialOfferItems = pgTable("special_offer_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  offerId: uuid("offer_id").notNull().references(() => specialOffers.id, { onDelete: "cascade" }),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  // The specific variant the admin chose for this product (null for products
  // that have no variants).
  variantId: uuid("variant_id").references(() => productVariants.id, { onDelete: "set null" }),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const specialOffersRelations = relations(specialOffers, ({ many }) => ({
  items: many(specialOfferItems),
}));

export const specialOfferItemsRelations = relations(specialOfferItems, ({ one }) => ({
  offer: one(specialOffers, {
    fields: [specialOfferItems.offerId],
    references: [specialOffers.id],
  }),
  product: one(products, {
    fields: [specialOfferItems.productId],
    references: [products.id],
  }),
}));
