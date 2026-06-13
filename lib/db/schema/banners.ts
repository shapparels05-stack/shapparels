import { pgTable, uuid, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";

// Homepage hero carousel slides, managed from the admin panel.
export const banners = pgTable("banners", {
  id: uuid("id").primaryKey().defaultRandom(),
  imageUrl: text("image_url").notNull(), // desktop / wide
  mobileImageUrl: text("mobile_image_url"), // optional portrait crop for phones
  textColor: text("text_color").notNull().default("light"), // "light" | "dark"
  textPosition: text("text_position").notNull().default("center"), // "left" | "center" | "right"
  textVAlign: text("text_v_align").notNull().default("center"), // "top" | "center" | "bottom"
  scrim: boolean("scrim").notNull().default(false), // legibility panel behind text
  headline: text("headline"),
  headlineAccent: text("headline_accent"), // accent word(s) shown in the primary colour
  subheadline: text("subheadline"),
  ctaLabel: text("cta_label"),
  ctaHref: text("cta_href"),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
