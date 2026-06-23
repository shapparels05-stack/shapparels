"use client";

import { useState, useMemo, useEffect } from "react";
import { PriceDisplay } from "@/components/shared/price-display";
import { VariantSelector } from "@/components/products/variant-selector";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { OfferCountdown } from "@/components/products/offer-countdown";
import { ProductImages } from "@/components/products/product-images";
import { ProductTrustBadges } from "@/components/products/product-trust-badges";
import { activeCompareAtPrice, isLimitedOfferActive } from "@/lib/pricing";
import { trackViewContent } from "@/lib/fb-pixel";

interface OptionType {
  id: string;
  name: string;
  values: { id: string; value: string }[];
}

interface Variant {
  id: string;
  sku: string | null;
  price: string;
  compareAtPrice: string | null;
  stock: number;
  optionValueIds: string[] | null;
}

interface ProductImageItem {
  id: string;
  url: string;
  alt: string | null;
  optionValue: string | null;
}

interface ProductDetailClientProps {
  product: {
    id: string;
    name: string;
    slug: string;
    basePrice: string;
    compareAtPrice: string | null;
    saleEndsAt?: Date | string | null;
    stock: number;
    image: string;
  };
  optionTypes: OptionType[];
  variants: Variant[];
  images: ProductImageItem[];
  discountPercent?: number;
  code?: string | null;
  infoHeader: React.ReactNode;
}

export function ProductDetailClient({
  product,
  optionTypes,
  variants,
  images,
  discountPercent,
  code,
  infoHeader,
}: ProductDetailClientProps) {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => {
    // Auto-select any option that has only one possible value (e.g. a product
    // with a single colour) so the customer doesn't have to pick it manually.
    const initial: Record<string, string> = {};
    for (const ot of optionTypes) {
      if (ot.values.length === 1) initial[ot.id] = ot.values[0].id;
    }
    return initial;
  });

  // Fire ViewContent once per product view.
  useEffect(() => {
    trackViewContent({
      id: product.id,
      name: product.name,
      value: parseFloat(product.basePrice),
    });
  }, [product.id, product.name, product.basePrice]);

  const handleOptionChange = (optionTypeId: string, valueId: string) => {
    setSelectedOptions((prev) => {
      // Toggle off if already selected
      if (prev[optionTypeId] === valueId) {
        const next = { ...prev };
        delete next[optionTypeId];
        return next;
      }
      return { ...prev, [optionTypeId]: valueId };
    });
  };

  const selectedVariant = useMemo(() => {
    if (optionTypes.length === 0 || variants.length === 0) return null;

    const selectedValueIds = Object.values(selectedOptions);
    if (selectedValueIds.length !== optionTypes.length) return null;

    return variants.find((v) =>
      selectedValueIds.every((id) => (v.optionValueIds ?? []).includes(id))
    ) || null;
  }, [selectedOptions, optionTypes, variants]);

  const displayPrice = selectedVariant
    ? parseFloat(selectedVariant.price)
    : parseFloat(product.basePrice);

  const rawCompareAt = selectedVariant?.compareAtPrice
    ? parseFloat(selectedVariant.compareAtPrice)
    : product.compareAtPrice
    ? parseFloat(product.compareAtPrice)
    : null;
  // The markdown is permanent; only the countdown ends when the deadline passes.
  const displayCompareAt = activeCompareAtPrice(rawCompareAt);
  const limitedOffer =
    !!displayCompareAt &&
    displayCompareAt > displayPrice &&
    isLimitedOfferActive(product.saleEndsAt);

  const variantLabel = useMemo(() => {
    if (!selectedVariant || optionTypes.length === 0) return null;
    return optionTypes
      .map((ot) => {
        const valueId = selectedOptions[ot.id];
        const value = ot.values.find((v) => v.id === valueId);
        return value ? `${ot.name}: ${value.value}` : "";
      })
      .filter(Boolean)
      .join(", ");
  }, [selectedVariant, optionTypes, selectedOptions]);

  const needsVariantSelection = optionTypes.length > 0 && !selectedVariant;

  // Stock for the chosen variant (or the product itself when it has no options).
  // Null while a multi-variant product still needs a selection.
  const effectiveStock = selectedVariant
    ? selectedVariant.stock
    : optionTypes.length === 0
    ? product.stock
    : null;
  const LOW_STOCK_THRESHOLD = 10;
  const showLowStock =
    effectiveStock !== null && effectiveStock > 0 && effectiveStock <= LOW_STOCK_THRESHOLD;

  const missingOptionsLabel = useMemo(() => {
    if (!needsVariantSelection) return null;
    const missing = optionTypes
      .filter((ot) => !selectedOptions[ot.id])
      .map((ot) => ot.name);
    return missing.length > 0 ? missing.join(", ") : null;
  }, [needsVariantSelection, optionTypes, selectedOptions]);

  // The label of the currently selected option value (e.g. the chosen colour).
  const selectedValueLabel = useMemo(() => {
    for (const ot of optionTypes) {
      const valueId = selectedOptions[ot.id];
      if (valueId) {
        const v = ot.values.find((x) => x.id === valueId);
        if (v) return v.value;
      }
    }
    return null;
  }, [optionTypes, selectedOptions]);

  // Gallery filtered to the selected colour's images (+ untagged/general ones).
  // Falls back to all images when a colour has none tagged.
  const filteredImages = useMemo(() => {
    if (!selectedValueLabel) return images;
    const norm = (s: string) => s.trim().toLowerCase();
    const tagged = images.filter(
      (i) => i.optionValue && norm(i.optionValue) === norm(selectedValueLabel)
    );
    if (tagged.length === 0) return images;
    const general = images.filter((i) => !i.optionValue);
    return [...tagged, ...general];
  }, [images, selectedValueLabel]);

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* Gallery — remounts on colour change so it resets to the first image */}
      <ProductImages
        key={selectedValueLabel ?? "all"}
        images={filteredImages}
        productName={product.name}
        discountPercent={discountPercent}
        code={code}
      />

      <div>
        {infoHeader}

        <div className="mt-6 space-y-6">
          <PriceDisplay
            price={displayPrice}
            compareAtPrice={displayCompareAt}
            className="text-2xl"
          />

          {showLowStock && (
            <div className="inline-flex items-center gap-1.5 rounded-md bg-destructive/10 px-3 py-1.5 text-sm font-semibold text-destructive">
              🔥 Hurry! Only {effectiveStock} {effectiveStock === 1 ? "piece" : "pieces"} left
            </div>
          )}

          {limitedOffer && product.saleEndsAt && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
              <p className="mb-2 text-sm font-semibold text-destructive">
                ⚡ Limited-time offer ends in
              </p>
              <OfferCountdown endsAt={product.saleEndsAt} variant="full" />
            </div>
          )}

          <VariantSelector
            optionTypes={optionTypes}
            variants={variants}
            selectedOptions={selectedOptions}
            onOptionChange={handleOptionChange}
          />

          <AddToCartButton
            product={{
              id: product.id,
              name: product.name,
              slug: product.slug,
              image: product.image,
              price: displayPrice,
              compareAtPrice: displayCompareAt,
            }}
            variantId={selectedVariant?.id || null}
            variantLabel={variantLabel}
            stock={selectedVariant ? selectedVariant.stock : optionTypes.length === 0 ? product.stock : undefined}
            needsVariantSelection={needsVariantSelection}
            missingOptionsLabel={missingOptionsLabel}
          />
        </div>

        <ProductTrustBadges />
      </div>
    </div>
  );
}
