import { db } from "@/lib/db";
import { siteSettings } from "@/lib/db/schema";
import { SHIPPING_COST, FREE_SHIPPING_THRESHOLD, MIN_ORDER_AMOUNT } from "@/lib/constants";

export async function getSiteSettings(): Promise<Record<string, string>> {
  const rows = await db.select().from(siteSettings);
  const map: Record<string, string> = {};
  for (const r of rows) if (r.value) map[r.key] = r.value;
  return map;
}

// Shipping charges, admin-editable in Settings. Falls back to the constants
// when unset or invalid, so the store always has working values.
export function parseShippingSettings(s: Record<string, string>) {
  const cost = parseInt(s.shipping_cost || "", 10);
  const threshold = parseInt(s.free_shipping_threshold || "", 10);
  const minOrder = parseInt(s.min_order_amount || "", 10);
  return {
    shippingCost: Number.isFinite(cost) && cost >= 0 ? cost : SHIPPING_COST,
    freeShippingThreshold:
      Number.isFinite(threshold) && threshold >= 0 ? threshold : FREE_SHIPPING_THRESHOLD,
    minOrderAmount: Number.isFinite(minOrder) && minOrder >= 0 ? minOrder : MIN_ORDER_AMOUNT,
  };
}

export async function getShippingSettings() {
  return parseShippingSettings(await getSiteSettings());
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
