import { pgTable, uuid, text, integer, boolean, timestamp, jsonb, numeric } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { categories } from "./categories";

export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  code: text("code"),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  shortDescription: text("short_description"),
  basePrice: numeric("base_price", { precision: 10, scale: 2 }).notNull(),
  compareAtPrice: numeric("compare_at_price", { precision: 10, scale: 2 }),
  // When set, the compareAtPrice discount is a limited-time offer that expires
  // at this moment (drives countdowns; discount auto-hides once past).
  saleEndsAt: timestamp("sale_ends_at", { withTimezone: true }),
  // When set (hours), the limited-time offer auto-repeats: once saleEndsAt
  // passes, the live deadline rolls forward in this interval indefinitely so
  // the countdown perpetually resets. Null = no repeat.
  saleRepeatHours: integer("sale_repeat_hours"),
  categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  stock: integer("stock").notNull().default(0),
  isFeatured: boolean("is_featured").notNull().default(false),
  isBestSeller: boolean("is_best_seller").notNull().default(false),
  // Which variant's price to show in the Best Sellers section (optional).
  bestSellerVariantId: uuid("best_seller_variant_id"),
  isActive: boolean("is_active").notNull().default(true),
  tags: jsonb("tags").$type<string[]>().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const productImages = pgTable("product_images", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  alt: text("alt"),
  // Color (option value label) this image belongs to; null = shown for all.
  optionValue: text("option_value"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const productOptionTypes = pgTable("product_option_types", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const productOptionValues = pgTable("product_option_values", {
  id: uuid("id").primaryKey().defaultRandom(),
  optionTypeId: uuid("option_type_id").notNull().references(() => productOptionTypes.id, { onDelete: "cascade" }),
  value: text("value").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const productVariants = pgTable("product_variants", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  sku: text("sku"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  compareAtPrice: numeric("compare_at_price", { precision: 10, scale: 2 }),
  stock: integer("stock").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  optionValueIds: jsonb("option_value_ids").$type<string[]>().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  images: many(productImages),
  optionTypes: many(productOptionTypes),
  variants: many(productVariants),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, {
    fields: [productImages.productId],
    references: [products.id],
  }),
}));

export const productOptionTypesRelations = relations(productOptionTypes, ({ one, many }) => ({
  product: one(products, {
    fields: [productOptionTypes.productId],
    references: [products.id],
  }),
  values: many(productOptionValues),
}));

export const productOptionValuesRelations = relations(productOptionValues, ({ one }) => ({
  optionType: one(productOptionTypes, {
    fields: [productOptionValues.optionTypeId],
    references: [productOptionTypes.id],
  }),
}));

export const productVariantsRelations = relations(productVariants, ({ one }) => ({
  product: one(products, {
    fields: [productVariants.productId],
    references: [products.id],
  }),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  products: many(products),
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: "categoryParent",
  }),
  children: many(categories, { relationName: "categoryParent" }),
}));
