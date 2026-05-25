"use client";

import { useEffect, useRef } from "react";
import { useCartStore } from "@/stores/cart-store";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { OrderSummary } from "@/components/checkout/order-summary";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { trackInitiateCheckout } from "@/lib/fb-pixel";

export default function CheckoutPage() {
  const itemCount = useCartStore((s) => s.getItemCount());
  const items = useCartStore((s) => s.items);
  const getTotal = useCartStore((s) => s.getTotal);
  const fired = useRef(false);

  // Fire InitiateCheckout once when the checkout page loads with items.
  useEffect(() => {
    if (fired.current || items.length === 0) return;
    fired.current = true;
    trackInitiateCheckout({
      value: getTotal(),
      contents: items.map((i) => ({
        id: i.productId,
        quantity: i.quantity,
        price: i.price,
      })),
    });
  }, [items, getTotal]);

  if (itemCount === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ShoppingBag className="h-16 w-16 text-muted-foreground/30" />
          <p className="mt-4 font-serif text-xl text-muted-foreground">
            Your cart is empty
          </p>
          <Button className="mt-6" asChild>
            <Link href="/products">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ label: "Cart", href: "/cart" }, { label: "Checkout" }]} />

      <h1 className="mt-6 font-serif text-3xl font-bold">Checkout</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CheckoutForm />
        </div>
        <div>
          <OrderSummary />
        </div>
      </div>
    </div>
  );
}
