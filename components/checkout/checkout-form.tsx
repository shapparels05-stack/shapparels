"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/stores/cart-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SHIPPING_COST, FREE_SHIPPING_THRESHOLD } from "@/lib/constants";
import { computeShipping } from "@/lib/shipping";
import { toast } from "sonner";

export function CheckoutForm() {
  const router = useRouter();
  const { items, getTotal, clearCart } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const subtotal = getTotal();
  const freeShipping = items.some((i) => i.freeShipping);
  const shipping = computeShipping(subtotal, freeShipping);
  const total = subtotal + shipping;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      customerName: formData.get("customerName") as string,
      customerPhone: formData.get("customerPhone") as string,
      customerEmail: formData.get("customerEmail") as string,
      shippingAddress: formData.get("shippingAddress") as string,
      shippingCity: formData.get("shippingCity") as string,
      shippingState: formData.get("shippingState") as string,
      shippingZipCode: formData.get("shippingZipCode") as string,
      notes: formData.get("notes") as string,
      items: items.map((item) => ({
        productId: item.productId,
        productName: item.name,
        productSlug: item.slug,
        productImage: item.image || null,
        variantId: item.variantId,
        variantLabel: item.variantLabel,
        price: item.price,
        quantity: item.quantity,
        total: item.price * item.quantity,
        offerId: item.offerId ?? null,
      })),
    };

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        if (result.errors) {
          const fieldErrors: Record<string, string> = {};
          for (const err of result.errors) {
            if (err.path?.[0]) {
              fieldErrors[err.path[0]] = err.message;
            }
          }
          setErrors(fieldErrors);
        } else {
          toast.error(result.error || "Something went wrong");
        }
        return;
      }

      clearCart();
      router.push(`/checkout/success?order=${result.orderNumber}`);
    } catch {
      toast.error("Failed to place order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <h3 className="font-serif text-lg font-semibold">Contact Information</h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="customerName">Full Name *</Label>
            <Input id="customerName" name="customerName" required placeholder="Your full name" />
            {errors.customerName && <p className="text-xs text-destructive">{errors.customerName}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="customerPhone">Phone Number *</Label>
            <Input id="customerPhone" name="customerPhone" required placeholder="03XX XXXXXXX" />
            {errors.customerPhone && <p className="text-xs text-destructive">{errors.customerPhone}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="customerEmail">Email (Optional)</Label>
          <Input id="customerEmail" name="customerEmail" type="email" placeholder="your@email.com" />
          {errors.customerEmail && <p className="text-xs text-destructive">{errors.customerEmail}</p>}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-serif text-lg font-semibold">Shipping Address</h3>
        <p className="text-xs text-muted-foreground">
          Free shipping on orders over Rs. {FREE_SHIPPING_THRESHOLD.toLocaleString()}. Below that, a flat rate of Rs. {SHIPPING_COST} applies.
        </p>

        <div className="space-y-2">
          <Label htmlFor="shippingAddress">Address *</Label>
          <Textarea id="shippingAddress" name="shippingAddress" required placeholder="Full street address" rows={2} />
          {errors.shippingAddress && <p className="text-xs text-destructive">{errors.shippingAddress}</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="shippingCity">City *</Label>
            <Input id="shippingCity" name="shippingCity" required placeholder="e.g. Lahore" />
            {errors.shippingCity && <p className="text-xs text-destructive">{errors.shippingCity}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="shippingState">State/Province</Label>
            <Input id="shippingState" name="shippingState" placeholder="e.g. Punjab" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="shippingZipCode">Zip Code</Label>
            <Input id="shippingZipCode" name="shippingZipCode" placeholder="e.g. 54000" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Order Notes (Optional)</Label>
          <Textarea id="notes" name="notes" placeholder="Any special instructions..." rows={2} />
        </div>
      </div>

      <div className="rounded-md border border-primary/30 bg-primary/5 p-4">
        <p className="text-sm font-medium">Payment: Cash on Delivery</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Pay when your order is delivered to your doorstep.
        </p>
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={loading || items.length === 0}>
        {loading ? "Placing Order..." : `Place Order — Rs. ${total.toLocaleString()}`}
      </Button>
    </form>
  );
}
