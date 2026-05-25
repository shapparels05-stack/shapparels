"use client";

import { useEffect } from "react";
import { trackPurchase } from "@/lib/fb-pixel";

interface PurchaseTrackerProps {
  orderNumber: string;
  value: number;
  contents: { id: string; quantity: number; price: number }[];
}

/**
 * Fires the Meta Pixel Purchase event when the thank-you page loads.
 * Guarded by localStorage so refreshing or revisiting the confirmation
 * page for the same order does not double-count the conversion.
 */
export function PurchaseTracker({
  orderNumber,
  value,
  contents,
}: PurchaseTrackerProps) {
  useEffect(() => {
    const key = `fb_purchase_${orderNumber}`;
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, "1");
    trackPurchase({ value, contents });
  }, [orderNumber, value, contents]);

  return null;
}
