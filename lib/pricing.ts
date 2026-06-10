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

/**
 * A limited-time offer is "active" only when it has a deadline still in the
 * future. A null deadline means a permanent markdown (not time-boxed).
 */
export function isLimitedOfferActive(saleEndsAt: Date | string | null | undefined): boolean {
  if (!saleEndsAt) return false;
  return new Date(saleEndsAt).getTime() > Date.now();
}

/**
 * The compareAtPrice to actually use for display. A discount whose deadline has
 * already passed is treated as expired (returns null), so the strike price and
 * "% OFF" badge disappear automatically once the timer runs out. A null
 * deadline leaves the discount permanently in effect.
 */
export function activeCompareAtPrice(
  compareAtPrice: number | null,
  saleEndsAt: Date | string | null | undefined
): number | null {
  if (compareAtPrice == null) return null;
  if (saleEndsAt && new Date(saleEndsAt).getTime() <= Date.now()) return null;
  return compareAtPrice;
}
