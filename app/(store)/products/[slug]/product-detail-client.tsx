"use client";

import { useState, useMemo } from "react";
import { PriceDisplay } from "@/components/shared/price-display";
import { VariantSelector } from "@/components/products/variant-selector";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";

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

interface ProductDetailClientProps {
  product: {
    id: string;
    name: string;
    slug: string;
    basePrice: string;
    compareAtPrice: string | null;
    stock: number;
    image: string;
  };
  optionTypes: OptionType[];
  variants: Variant[];
}

export function ProductDetailClient({
  product,
  optionTypes,
  variants,
}: ProductDetailClientProps) {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});

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

  const displayCompareAt = selectedVariant?.compareAtPrice
    ? parseFloat(selectedVariant.compareAtPrice)
    : product.compareAtPrice
    ? parseFloat(product.compareAtPrice)
    : null;

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

  const missingOptionsLabel = useMemo(() => {
    if (!needsVariantSelection) return null;
    const missing = optionTypes
      .filter((ot) => !selectedOptions[ot.id])
      .map((ot) => ot.name);
    return missing.length > 0 ? missing.join(", ") : null;
  }, [needsVariantSelection, optionTypes, selectedOptions]);

  return (
    <div className="mt-6 space-y-6">
      <PriceDisplay
        price={displayPrice}
        compareAtPrice={displayCompareAt}
        className="text-2xl"
      />

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

      {needsVariantSelection && (
        <p className="text-sm text-muted-foreground">
          Please select all options to continue.
        </p>
      )}
    </div>
  );
}
