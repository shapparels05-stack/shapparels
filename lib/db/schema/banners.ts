import { pgTable, uuid, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";

// Homepage hero carousel slides, managed from the admin panel.
export const banners = pgTable("banners", {
  id: uuid("id").primaryKey().defaultRandom(),
  imageUrl: text("image_url").notNull(),
  headline: text("headline"),
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
