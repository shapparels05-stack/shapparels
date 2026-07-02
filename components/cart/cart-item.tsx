"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/cart-store";
import { CURRENCY_SYMBOL } from "@/lib/constants";
import type { CartItem as CartItemType } from "@/stores/cart-store";

interface CartItemProps {
  item: CartItemType;
}

export function CartItem({ item }: CartItemProps) {
  const { removeItem, updateQuantity } = useCartStore();

  return (
    <div className="flex gap-4 py-4">
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-md border border-border/50 bg-card">
        {item.image ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            className="object-cover"
            sizes="96px"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            No Image
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between">
        <div>
          <Link
            href={item.isBundle ? `/special-offers/${item.slug}` : `/products/${item.slug}`}
            className="font-serif text-sm font-medium hover:text-primary transition-colors"
          >
            {item.name}
          </Link>
          {item.variantLabel && (
            <p className="text-xs text-muted-foreground mt-0.5">{item.variantLabel}</p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center rounded-md border border-border">
            <button
              onClick={() =>
                updateQuantity(item.productId, item.variantId, item.quantity - 1)
              }
              className="flex h-8 w-8 items-center justify-center hover:bg-accent transition-colors"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="flex h-8 w-8 items-center justify-center text-sm">
              {item.quantity}
            </span>
            <button
              onClick={() =>
                updateQuantity(item.productId, item.variantId, item.quantity + 1)
              }
              disabled={item.maxStock !== undefined && item.quantity >= item.maxStock}
              className="flex h-8 w-8 items-center justify-center hover:bg-accent transition-colors disabled:opacity-30"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">
              {CURRENCY_SYMBOL} {(item.price * item.quantity).toLocaleString()}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => removeItem(item.productId, item.variantId)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
