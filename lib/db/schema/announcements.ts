import { pgTable, uuid, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";

// Scrolling announcement bar messages, managed from the admin panel.
export const announcements = pgTable("announcements", {
  id: uuid("id").primaryKey().defaultRandom(),
  text: text("text").notNull(),
  icon: text("icon"), // lucide icon key (see ANNOUNCEMENT_ICONS)
  href: text("href"), // optional link the message points to
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
