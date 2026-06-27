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
 * The live deadline for a countdown. Normally this is just `saleEndsAt`, but
 * when `repeatHours` is set and the deadline has passed, it rolls forward in
 * whole `repeatHours` intervals to the next future boundary — so a repeating
 * offer's countdown perpetually resets without any cron/background job.
 * Returns null when there's no deadline.
 */
export function currentDeadline(
  saleEndsAt: Date | string | null | undefined,
  repeatHours?: number | null
): Date | null {
  if (!saleEndsAt) return null;
  const end = new Date(saleEndsAt).getTime();
  if (isNaN(end)) return null;
  if (!repeatHours || repeatHours <= 0) return new Date(end);
  const now = Date.now();
  if (end > now) return new Date(end);
  const step = repeatHours * 3600_000;
  const periods = Math.ceil((now - end) / step);
  return new Date(end + periods * step);
}

/**
 * A limited-time offer is "active" only when its (possibly repeated) deadline is
 * still in the future. A null deadline means a permanent markdown (not
 * time-boxed). A repeating offer is effectively always active.
 */
export function isLimitedOfferActive(
  saleEndsAt: Date | string | null | undefined,
  repeatHours?: number | null
): boolean {
  const deadline = currentDeadline(saleEndsAt, repeatHours);
  if (!deadline) return false;
  return deadline.getTime() > Date.now();
}

/**
 * The compareAtPrice to actually use for display.
 *
 * The markdown is PERMANENT: as long as a compareAtPrice is set, the strike
 * price and "% OFF" badge stay visible until the price is removed manually.
 * A passed `saleEndsAt` deadline no longer hides the discount — it only ends
 * the limited-time countdown (see {@link isLimitedOfferActive}). So once a
 * timer runs out, the urgency badge disappears but the discount remains.
 */
export function activeCompareAtPrice(
  compareAtPrice: number | null
): number | null {
  return compareAtPrice;
}
