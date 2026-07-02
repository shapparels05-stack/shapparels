"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag, Minus, Plus, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/cart-store";
import { trackAddToCart } from "@/lib/fb-pixel";
import { toast } from "sonner";

interface BundleAddToCartProps {
  offer: {
    id: string;
    code: string;
    name: string;
    slug: string;
    price: number;
    originalPrice: number;
    image: string;
    available: boolean;
  };
}

export function BundleAddToCart({ offer }: BundleAddToCartProps) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((s) => s.addItem);
  const openSheet = useCartStore((s) => s.openSheet);

  const label = `${offer.code} - ${offer.name}`;

  const add = () => {
    if (!offer.available) return false;
    addItem({
      productId: offer.id,
      variantId: null,
      name: label,
      slug: offer.slug,
      image: offer.image,
      price: offer.price,
      compareAtPrice: offer.originalPrice > offer.price ? offer.originalPrice : null,
      variantLabel: null,
      isBundle: true,
      offerId: offer.id,
      quantity,
    });
    trackAddToCart({ id: offer.id, name: label, price: offer.price, quantity });
    setQuantity(1);
    return true;
  };

  const handleAdd = () => {
    if (!add()) return;
    toast.success(`${offer.name} added to cart`);
    openSheet();
  };

  const handleBuyNow = () => {
    if (!add()) return;
    router.push("/checkout");
  };

  if (!offer.available) {
    return (
      <Button size="lg" className="w-full" disabled>
        <ShoppingBag className="mr-2 h-5 w-5" />
        Out of Stock
      </Button>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Quantity</span>
        <div className="flex items-center rounded-md border border-border">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="flex h-9 w-9 items-center justify-center transition-colors hover:bg-accent"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="flex h-9 w-10 items-center justify-center text-sm font-medium">
            {quantity}
          </span>
          <button
            onClick={() => setQuantity(quantity + 1)}
            className="flex h-9 w-9 items-center justify-center transition-colors hover:bg-accent"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <Button size="lg" className="w-full" onClick={handleAdd}>
        <ShoppingBag className="mr-2 h-5 w-5" />
        Add to Cart
      </Button>
      <Button size="lg" variant="outline" className="w-full" onClick={handleBuyNow}>
        <CreditCard className="mr-2 h-5 w-5" />
        Buy Now
      </Button>
    </div>
  );
}
