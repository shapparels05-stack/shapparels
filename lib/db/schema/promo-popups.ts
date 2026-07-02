import { pgTable, uuid, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";

// Promotional popups (interstitial "poster" modals). Shown one-at-a-time on the
// storefront, highest priority (lowest sortOrder) first.
export const promoPopups = pgTable("promo_popups", {
  id: uuid("id").primaryKey().defaultRandom(),
  // Internal label (also used as image alt text).
  title: text("title"),
  imageUrl: text("image_url").notNull(),
  // Where clicking the poster goes (any URL). Null = not clickable.
  linkUrl: text("link_url"),
  // How often to re-show the same visitor: "daily" | "session" | "always".
  frequency: text("frequency").notNull().default("daily"),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
