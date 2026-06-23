"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ShoppingBag, Minus, Plus, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PriceDisplay } from "@/components/shared/price-display";
import { useCartStore } from "@/stores/cart-store";
import { trackAddToCart } from "@/lib/fb-pixel";
import { toast } from "sonner";

interface AddToCartButtonProps {
  product: {
    id: string;
    name: string;
    slug: string;
    image: string;
    price: number;
    compareAtPrice: number | null;
  };
  variantId: string | null;
  variantLabel: string | null;
  stock?: number;
  needsVariantSelection?: boolean;
  missingOptionsLabel?: string | null;
}

export function AddToCartButton({
  product,
  variantId,
  variantLabel,
  stock,
  needsVariantSelection = false,
  missingOptionsLabel,
}: AddToCartButtonProps) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  // Track whether the inline buttons are scrolled out of view so we can
  // reveal a sticky bottom bar in their place (mobile).
  const inlineRef = useRef<HTMLDivElement>(null);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const openSheet = useCartStore((s) => s.openSheet);
  const cartItems = useCartStore((s) => s.items);

  // How many of this item are already in the cart
  const cartKey = `${product.id}-${variantId ?? "default"}`;
  const inCart = cartItems.find(
    (i) => `${i.productId}-${i.variantId ?? "default"}` === cartKey
  )?.quantity ?? 0;
  const remaining = stock !== undefined ? stock - inCart : Infinity;
  const allInCart = stock !== undefined && remaining <= 0;
  const outOfStock = stock !== undefined && stock <= 0;

  // Show the sticky bar only while the inline buttons are off-screen.
  useEffect(() => {
    const el = inlineRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyBar(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const variantErrorMessage = missingOptionsLabel
    ? `Please select ${missingOptionsLabel} first`
    : "Please select all options first";

  const ensureSelection = () => {
    if (needsVariantSelection) {
      toast.error(variantErrorMessage);
      return false;
    }
    return true;
  };

  const performAdd = () => {
    if (stock !== undefined && (remaining <= 0 || quantity > remaining)) {
      toast.error(
        remaining <= 0 ? "All stock is already in your cart" : `Only ${remaining} more available`
      );
      return false;
    }
    addItem({
      productId: product.id,
      variantId,
      name: product.name,
      slug: product.slug,
      image: product.image,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      variantLabel,
      quantity,
      maxStock: stock,
    });
    trackAddToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity,
    });
    setQuantity(1);
    return true;
  };

  const handleAddToCart = () => {
    if (!ensureSelection()) return;
    if (!performAdd()) return;
    toast.success(`${product.name} added to cart`);
    openSheet();
  };

  const handleCheckout = () => {
    if (!ensureSelection()) return;
    if (!performAdd()) return;
    router.push("/checkout");
  };

  return (
    <div className="space-y-3">
      {/* Quantity */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Quantity</span>
        <div className="flex items-center rounded-md border border-border">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="flex h-9 w-9 items-center justify-center hover:bg-accent transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="flex h-9 w-10 items-center justify-center text-sm font-medium">
            {quantity}
          </span>
          <button
            onClick={() => setQuantity(Math.min(quantity + 1, Math.max(remaining, 1)))}
            disabled={stock !== undefined && quantity >= remaining}
            className="flex h-9 w-9 items-center justify-center hover:bg-accent transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        {stock !== undefined && (
          <span className={`text-xs ${remaining <= 0 ? "text-destructive" : "text-muted-foreground"}`}>
            {inCart > 0 ? `${remaining} left (${inCart} in cart)` : `${stock} in stock`}
          </span>
        )}
      </div>

      {/* Inline actions */}
      <div ref={inlineRef} className="space-y-3">
        {/* Add to Cart */}
        <Button
          size="lg"
          className="w-full"
          onClick={handleAddToCart}
          disabled={outOfStock || allInCart}
        >
          <ShoppingBag className="mr-2 h-5 w-5" />
          {outOfStock
            ? "Out of Stock"
            : allInCart
            ? "All Stock in Cart"
            : "Add to Cart"}
        </Button>

        {/* Checkout */}
        <Button
          size="lg"
          variant="outline"
          className="w-full"
          onClick={handleCheckout}
          disabled={outOfStock || allInCart}
        >
          <CreditCard className="mr-2 h-5 w-5" />
          Buy Now
        </Button>
      </div>

      {/* Sticky bottom bar — appears on mobile once the inline buttons scroll
          out of view, keeping the primary action reachable anywhere on the page. */}
      <div
        className={`fixed inset-x-0 bottom-0 z-40 bg-gradient-to-t from-background via-background/95 to-transparent pt-10 transition-transform duration-300 ${
          showStickyBar ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto flex max-w-4xl flex-col gap-2 px-4 pb-3 pr-20 sm:flex-row sm:items-center sm:gap-4 sm:pr-24">
          {/* Left: product image + name + price + quantity counter */}
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="relative hidden h-14 w-14 shrink-0 overflow-hidden rounded-md border border-border sm:block">
              <Image
                src={product.image}
                alt={product.name}
                fill
                sizes="56px"
                className="object-cover"
              />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{product.name}</p>
              <PriceDisplay
                price={product.price}
                compareAtPrice={product.compareAtPrice}
                className="text-sm"
              />
              <div className="mt-1 hidden w-fit items-center rounded-md border border-border sm:flex">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="flex h-7 w-7 items-center justify-center transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="flex h-7 w-8 items-center justify-center text-xs font-medium">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(quantity + 1, Math.max(remaining, 1)))}
                  disabled={stock !== undefined && quantity >= remaining}
                  className="flex h-7 w-7 items-center justify-center transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Buttons — inline on mobile, stacked on desktop */}
          <div className="flex shrink-0 flex-row gap-2 sm:flex-col">
            <Button
              size="sm"
              className="flex-1 sm:flex-none"
              onClick={handleAddToCart}
              disabled={outOfStock || allInCart}
            >
              <ShoppingBag className="mr-2 h-4 w-4" />
              {outOfStock
                ? "Out of Stock"
                : allInCart
                ? "All in Cart"
                : "Add to Cart"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 sm:flex-none"
              onClick={handleCheckout}
              disabled={outOfStock || allInCart}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Buy Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
