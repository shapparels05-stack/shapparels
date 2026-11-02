"use client";

import { useEffect, useState } from "react";
import { SHIPPING_COST, FREE_SHIPPING_THRESHOLD, MIN_ORDER_AMOUNT } from "@/lib/constants";

export interface ShippingConfig {
  shippingCost: number;
  freeShippingThreshold: number;
  minOrderAmount: number;
}

const DEFAULTS: ShippingConfig = {
  shippingCost: SHIPPING_COST,
  freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
  minOrderAmount: MIN_ORDER_AMOUNT,
};

// Module-level cache so cart, checkout form and summary on the same page all
// share one /api/settings request per page load.
let cached: ShippingConfig | null = null;
let pending: Promise<ShippingConfig> | null = null;

function load(): Promise<ShippingConfig> {
  pending ??= fetch("/api/settings")
    .then((r) => r.json())
    .then((s) => {
      const cost = parseInt(s.shipping_cost || "", 10);
      const threshold = parseInt(s.free_shipping_threshold || "", 10);
      const minOrder = parseInt(s.min_order_amount || "", 10);
      cached = {
        shippingCost: Number.isFinite(cost) && cost >= 0 ? cost : DEFAULTS.shippingCost,
        freeShippingThreshold:
          Number.isFinite(threshold) && threshold >= 0
            ? threshold
            : DEFAULTS.freeShippingThreshold,
        minOrderAmount:
          Number.isFinite(minOrder) && minOrder >= 0 ? minOrder : DEFAULTS.minOrderAmount,
      };
      return cached;
    })
    .catch(() => DEFAULTS);
  return pending;
}

// Live admin-configured shipping charge + free-shipping threshold. Returns the
// code defaults until the settings request resolves.
export function useShippingConfig(): ShippingConfig {
  const [config, setConfig] = useState<ShippingConfig>(cached ?? DEFAULTS);

  useEffect(() => {
    if (cached) return;
    let active = true;
    load().then((c) => {
      if (active) setConfig(c);
    });
    return () => {
      active = false;
    };
  }, []);

  return config;
}
