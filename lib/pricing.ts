/**
 * Discount percent rounded UP to the nearest 5% bucket.
 *
 * Used for the "UP TO X% OFF" badge: bucketing makes that phrasing
 * honest because the displayed number is genuinely an upper bound on
 * the actual saving (e.g. real discounts of 21–25% all show as 25,
 * 26–30% all show as 30, etc).
 *
 * Returns 0 when there is no discount.
 */
export function bucketDiscountPercent(
  basePrice: number,
  compareAtPrice: number | null
): number {
  if (!compareAtPrice || compareAtPrice <= basePrice) return 0;
  const raw = ((compareAtPrice - basePrice) / compareAtPrice) * 100;
  // Round up to nearest 5; floor at 5% so tiny discounts still read sensibly.
  return Math.max(5, Math.ceil(raw / 5) * 5);
}
