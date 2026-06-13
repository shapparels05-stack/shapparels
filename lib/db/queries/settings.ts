import { db } from "@/lib/db";
import { siteSettings } from "@/lib/db/schema";

export async function getSiteSettings(): Promise<Record<string, string>> {
  const rows = await db.select().from(siteSettings);
  const map: Record<string, string> = {};
  for (const r of rows) if (r.value) map[r.key] = r.value;
  return map;
}

// Upsert a batch of key/value settings.
export async function setSiteSettings(updates: Record<string, string>) {
  for (const [key, value] of Object.entries(updates)) {
    await db
      .insert(siteSettings)
      .values({ key, value })
      .onConflictDoUpdate({ target: siteSettings.key, set: { value } });
  }
}
