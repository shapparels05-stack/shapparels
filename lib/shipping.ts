import { SHIPPING_COST, FREE_SHIPPING_THRESHOLD } from "./constants";

// Shipping cost for an order. Free when a free-shipping bundle is present, or
// when the subtotal reaches the free-shipping threshold; otherwise the flat rate.
// The rate and threshold default to the constants but callers should pass the
// live admin-configured values (getShippingSettings / useShippingConfig).
export function computeShipping(
  subtotal: number,
  freeShipping = false,
  cost = SHIPPING_COST,
  threshold = FREE_SHIPPING_THRESHOLD
): number {
  if (freeShipping) return 0;
  return subtotal >= threshold ? 0 : cost;
}
