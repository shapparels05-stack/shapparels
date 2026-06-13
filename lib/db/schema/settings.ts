import { pgTable, text } from "drizzle-orm/pg-core";

// Simple key/value store for editable site settings (social links, etc.).
export const siteSettings = pgTable("site_settings", {
  key: text("key").primaryKey(),
  value: text("value"),
});
