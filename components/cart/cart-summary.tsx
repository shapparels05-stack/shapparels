"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCartStore } from "@/stores/cart-store";
import { CURRENCY_SYMBOL, FREE_SHIPPING_THRESHOLD } from "@/lib/constants";
import { computeShipping } from "@/lib/shipping";

export function CartSummary() {
  const subtotal = useCartStore((s) => s.getTotal());
  const items = useCartStore((s) => s.items);
  const freeShipping = items.some((i) => i.freeShipping);
  const shipping = computeShipping(subtotal, freeShipping);
  const total = subtotal + shipping;

  return (
    <div className="rounded-lg border border-border/50 bg-card p-6">
      <h3 className="font-serif text-lg font-semibold">Order Summary</h3>

      <div className="mt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{CURRENCY_SYMBOL} {subtotal.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Shipping</span>
          <span>
            {shipping === 0 ? (
              <span className="text-primary">Free</span>
            ) : (
              `${CURRENCY_SYMBOL} ${shipping.toLocaleString()}`
            )}
          </span>
        </div>
        {!freeShipping && subtotal > 0 && subtotal < FREE_SHIPPING_THRESHOLD && (
          <p className="text-xs text-muted-foreground">
            Add {CURRENCY_SYMBOL} {(FREE_SHIPPING_THRESHOLD - subtotal).toLocaleString()} more for free shipping
          </p>
        )}
      </div>

      <Separator className="my-4" />

      <div className="flex justify-between font-semibold">
        <span>Total</span>
        <span>{CURRENCY_SYMBOL} {total.toLocaleString()}</span>
      </div>

      <Button className="mt-6 w-full" size="lg" asChild>
        <Link href="/checkout">Proceed to Checkout</Link>
      </Button>

      <p className="mt-3 text-center text-xs text-muted-foreground">
        Cash on Delivery Only
      </p>
    </div>
  );
}
