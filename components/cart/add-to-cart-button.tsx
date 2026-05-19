"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag, Minus, Plus, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/cart-store";
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
        Checkout
      </Button>
    </div>
  );
}
