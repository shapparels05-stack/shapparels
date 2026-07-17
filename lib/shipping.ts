import { SHIPPING_COST, FREE_SHIPPING_THRESHOLD } from "./constants";

// Shipping cost for an order. Free when a free-shipping bundle is present, or
// when the subtotal reaches the free-shipping threshold; otherwise the flat rate.
export function computeShipping(subtotal: number, freeShipping = false): number {
  if (freeShipping) return 0;
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
}
