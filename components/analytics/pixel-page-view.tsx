"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackPageView } from "@/lib/fb-pixel";

// Pages that should NOT send a Meta Pixel PageView.
// - /cart and /checkout/success: requested by marketing (avoid funnel noise;
//   the thank-you page reports a Purchase instead).
// - /admin: internal traffic, should never hit the storefront pixel.
const EXCLUDED_PREFIXES = ["/cart", "/checkout/success", "/admin"];

function isExcluded(pathname: string) {
  return EXCLUDED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

/**
 * Fires PageView on the initial load and on every client-side route change,
 * except for excluded paths. Replaces the automatic PageView that used to live
 * in the base pixel snippet, so we can control it per route.
 */
export function PixelPageView() {
  const pathname = usePathname();

  useEffect(() => {
    if (isExcluded(pathname)) return;
    trackPageView();
  }, [pathname]);

  return null;
}
