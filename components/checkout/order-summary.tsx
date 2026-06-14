"use client";

import Image from "next/image";
import { Separator } from "@/components/ui/separator";
import { useCartStore } from "@/stores/cart-store";
import { CURRENCY_SYMBOL, SHIPPING_COST, FREE_SHIPPING_THRESHOLD } from "@/lib/constants";
import { Truck } from "lucide-react";

export function OrderSummary() {
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.getTotal());
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const total = subtotal + shipping;

  return (
    <div className="rounded-lg border border-border/50 bg-card p-6">
      <h3 className="font-serif text-lg font-semibold">Order Summary</h3>

      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div
            key={`${item.productId}-${item.variantId}`}
            className="flex gap-3"
          >
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-border/50">
              {item.image ? (
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">
                  No img
                </div>
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium line-clamp-1">{item.name}</p>
              {item.variantLabel && (
                <p className="text-xs text-muted-foreground">{item.variantLabel}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Qty: {item.quantity} × {CURRENCY_SYMBOL} {item.price.toLocaleString()}
              </p>
            </div>
            <p className="text-sm font-medium">
              {CURRENCY_SYMBOL} {(item.price * item.quantity).toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      <Separator className="my-4" />

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{CURRENCY_SYMBOL} {subtotal.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Shipping</span>
          <span>
            {shipping === 0 ? (
              <span className="text-primary">Free</span>
            ) : (
              `${CURRENCY_SYMBOL} ${shipping.toLocaleString()}`
            )}
          </span>
        </div>
      </div>

      <Separator className="my-4" />

      <div className="flex justify-between text-lg font-semibold">
        <span>Total</span>
        <span>{CURRENCY_SYMBOL} {total.toLocaleString()}</span>
      </div>

      {subtotal > 0 && subtotal < FREE_SHIPPING_THRESHOLD && (
        <div className="mt-4 flex items-center gap-2 rounded-md bg-primary/5 p-3 text-xs text-muted-foreground">
          <Truck className="h-4 w-4 text-primary shrink-0" />
          <span>Add {CURRENCY_SYMBOL} {(FREE_SHIPPING_THRESHOLD - subtotal).toLocaleString()} more for free shipping!</span>
        </div>
      )}
    </div>
  );
}
