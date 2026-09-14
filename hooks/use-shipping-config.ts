"use client";

import { useEffect, useState } from "react";
import { SHIPPING_COST, FREE_SHIPPING_THRESHOLD } from "@/lib/constants";

export interface ShippingConfig {
  shippingCost: number;
  freeShippingThreshold: number;
}

const DEFAULTS: ShippingConfig = {
  shippingCost: SHIPPING_COST,
  freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
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
      cached = {
        shippingCost: Number.isFinite(cost) && cost >= 0 ? cost : DEFAULTS.shippingCost,
        freeShippingThreshold:
          Number.isFinite(threshold) && threshold >= 0
            ? threshold
            : DEFAULTS.freeShippingThreshold,
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
