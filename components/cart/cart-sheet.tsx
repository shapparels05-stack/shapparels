"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCartStore } from "@/stores/cart-store";
import { CURRENCY_SYMBOL } from "@/lib/constants";

export function CartSheet() {
  const isOpen = useCartStore((s) => s.isSheetOpen);
  const setSheetOpen = useCartStore((s) => s.setSheetOpen);
  const closeSheet = useCartStore((s) => s.closeSheet);
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.getTotal());
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const itemCount = items.reduce((c, i) => c + i.quantity, 0);

  return (
    <Sheet open={isOpen} onOpenChange={setSheetOpen}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
        <SheetHeader className="border-b">
          <SheetTitle className="font-serif text-lg">
            Your Cart {itemCount > 0 && `(${itemCount})`}
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <ShoppingBag className="h-12 w-12 text-muted-foreground/30" />
            <p className="mt-4 font-serif text-base text-muted-foreground">
              Your cart is empty
            </p>
            <Button className="mt-6" onClick={closeSheet} asChild>
              <Link href="/products">Continue Shopping</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-4">
              <ul className="divide-y divide-border/50">
                {items.map((item) => (
                  <li key={`${item.productId}-${item.variantId}`} className="flex gap-3 py-4">
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md border border-border/50 bg-card">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          unoptimized
                          className="object-cover"
                          sizes="80px"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                          No Image
                        </div>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col justify-between min-w-0">
                      <div>
                        <Link
                          href={`/products/${item.slug}`}
                          onClick={closeSheet}
                          className="font-serif text-sm font-medium hover:text-primary transition-colors line-clamp-2"
                        >
                          {item.name}
                        </Link>
                        {item.variantLabel && (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {item.variantLabel}
                          </p>
                        )}
                      </div>

                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center rounded-md border border-border">
                          <button
                            onClick={() =>
                              updateQuantity(item.productId, item.variantId, item.quantity - 1)
                            }
                            className="flex h-7 w-7 items-center justify-center hover:bg-accent transition-colors"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="flex h-7 w-7 items-center justify-center text-xs">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(item.productId, item.variantId, item.quantity + 1)
                            }
                            disabled={item.maxStock !== undefined && item.quantity >= item.maxStock}
                            className="flex h-7 w-7 items-center justify-center hover:bg-accent transition-colors disabled:opacity-30"
                            aria-label="Increase quantity"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {CURRENCY_SYMBOL} {(item.price * item.quantity).toLocaleString()}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => removeItem(item.productId, item.variantId)}
                            aria-label="Remove item"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <SheetFooter className="border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold">
                  {CURRENCY_SYMBOL} {subtotal.toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Shipping calculated at checkout.
              </p>
              <Separator className="my-1" />
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button variant="outline" className="flex-1" onClick={closeSheet} asChild>
                  <Link href="/cart">View Cart</Link>
                </Button>
                <Button className="flex-1" onClick={closeSheet} asChild>
                  <Link href="/checkout">Checkout</Link>
                </Button>
              </div>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
