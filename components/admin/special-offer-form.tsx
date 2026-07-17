"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ImageUpload } from "./image-upload";
import { ProductMultiSelect } from "./product-multi-select";
import { normalizeSlug } from "@/lib/slug";
import { CURRENCY_SYMBOL } from "@/lib/constants";
import type { PickerProduct } from "@/lib/db/queries/special-offers";

interface SpecialOfferFormProps {
  products: PickerProduct[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialData?: any;
}

function toDatetimeLocal(value: string | Date | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export function SpecialOfferForm({ products, initialData }: SpecialOfferFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>(initialData?.images || []);
  const [productIds, setProductIds] = useState<string[]>(
    (initialData?.items || []).map((i: { productId: string }) => i.productId)
  );
  // Chosen variant per product (for products that have variants).
  const [variantByProduct, setVariantByProduct] = useState<Record<string, string>>(() => {
    const m: Record<string, string> = {};
    for (const it of initialData?.items || []) if (it.variantId) m[it.productId] = it.variantId;
    return m;
  });
  const [slug, setSlug] = useState<string>(initialData?.slug || "");
  const [price, setPrice] = useState<string>(initialData?.price?.toString() || "");
  const [saleRepeat, setSaleRepeat] = useState<boolean>(!!initialData?.saleRepeatHours);
  const [saleRepeatHours, setSaleRepeatHours] = useState<string>(
    initialData?.saleRepeatHours?.toString() || "24"
  );
  const [freeShipping, setFreeShipping] = useState<boolean>(!!initialData?.freeShipping);

  const productMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  // The chosen variant id for a product (defaults to its first variant).
  const chosenVariantId = (pid: string): string | null => {
    const p = productMap.get(pid);
    if (!p || p.variants.length === 0) return null;
    return variantByProduct[pid] ?? p.variants[0].id;
  };

  // Unit price of a product line = chosen variant price, or base price.
  const unitPrice = (pid: string): number => {
    const p = productMap.get(pid);
    if (!p) return 0;
    const vid = chosenVariantId(pid);
    if (vid) {
      const v = p.variants.find((x) => x.id === vid);
      if (v) return parseFloat(v.price);
    }
    return parseFloat(p.basePrice || "0");
  };

  const originalPrice = productIds.reduce((s, id) => s + unitPrice(id), 0);
  const offerPrice = parseFloat(price) || 0;
  const savings = Math.max(0, originalPrice - offerPrice);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (productIds.length === 0) {
      toast.error("Select at least one product for the bundle");
      return;
    }
    setLoading(true);
    const formData = new FormData(e.currentTarget);

    const data = {
      code: (formData.get("code") as string).trim(),
      name: (formData.get("name") as string).trim(),
      slug: normalizeSlug(slug || (formData.get("name") as string)),
      description: (formData.get("description") as string) || null,
      price: parseFloat(formData.get("price") as string),
      images,
      saleEndsAt: (formData.get("saleEndsAt") as string) || null,
      saleRepeatHours: saleRepeat ? parseInt(saleRepeatHours) || null : null,
      freeShipping,
      isActive: formData.get("isActive") === "on",
      sortOrder: parseInt(formData.get("sortOrder") as string) || 0,
      items: productIds.map((pid) => ({ productId: pid, variantId: chosenVariantId(pid) })),
    };

    try {
      const url = initialData
        ? `/api/admin/special-offers/${initialData.id}`
        : "/api/admin/special-offers";
      const res = await fetch(url, {
        method: initialData ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Failed to save offer");
        return;
      }
      toast.success(initialData ? "Offer updated" : "Offer created");
      router.push("/admin/special-offers");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-serif">Offer Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="code">Offer Code *</Label>
              <Input id="code" name="code" required placeholder="e.g. COMB001" defaultValue={initialData?.code} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Offer Name *</Label>
              <Input
                id="name"
                name="name"
                required
                defaultValue={initialData?.name}
                onChange={(e) => {
                  if (!initialData) setSlug(normalizeSlug(e.target.value));
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug (URL)</Label>
              <Input
                id="slug"
                name="slug"
                readOnly
                tabIndex={-1}
                value={slug}
                className="cursor-not-allowed bg-muted text-muted-foreground"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" rows={3} defaultValue={initialData?.description} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif">Products &amp; Pricing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Products in this bundle *</Label>
            <ProductMultiSelect options={products} value={productIds} onChange={setProductIds} />
          </div>

          {productIds.some((pid) => (productMap.get(pid)?.variants.length ?? 0) > 0) && (
            <div className="space-y-2">
              <Label>Choose a variant for each product</Label>
              <div className="space-y-2">
                {productIds.map((pid) => {
                  const p = productMap.get(pid);
                  if (!p || p.variants.length === 0) return null;
                  return (
                    <div key={pid} className="flex items-center gap-3">
                      <span className="w-40 shrink-0 truncate text-sm">{p.name}</span>
                      <Select
                        value={chosenVariantId(pid) ?? undefined}
                        onValueChange={(v) => setVariantByProduct((m) => ({ ...m, [pid]: v }))}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {p.variants.map((v) => (
                            <SelectItem key={v.id} value={v.id}>
                              {v.label} — Rs. {parseFloat(v.price).toLocaleString()} ({v.stock} in stock)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="price">Offer Price (PKR) *</Label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sortOrder">Sort Order</Label>
              <Input id="sortOrder" name="sortOrder" type="number" defaultValue={initialData?.sortOrder ?? 0} />
            </div>
          </div>

          {/* Live pricing preview */}
          <div className="rounded-md border border-border/50 bg-muted/40 p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Original (sum of products)</span>
              <span className="line-through">{CURRENCY_SYMBOL} {originalPrice.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Offer price</span>
              <span className="font-semibold">{CURRENCY_SYMBOL} {offerPrice.toLocaleString()}</span>
            </div>
            <div className="mt-1 flex justify-between border-t border-border/50 pt-1 font-semibold text-primary">
              <span>Customer saves</span>
              <span>{CURRENCY_SYMBOL} {savings.toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif">Images</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <ImageUpload images={images} onChange={setImages} />
          <p className="text-xs text-muted-foreground">
            The bundle&apos;s own images show first; the included products&apos; images are added to the gallery automatically.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif">Limited-Time Timer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="saleEndsAt">Offer Ends</Label>
            <Input
              id="saleEndsAt"
              name="saleEndsAt"
              type="datetime-local"
              defaultValue={toDatetimeLocal(initialData?.saleEndsAt)}
            />
            <p className="text-xs text-muted-foreground">Optional. Shows a countdown. Leave blank for no timer.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Checkbox id="saleRepeat" checked={saleRepeat} onCheckedChange={(c) => setSaleRepeat(c === true)} />
              <Label htmlFor="saleRepeat">Repeat offer</Label>
            </div>
            {saleRepeat && (
              <div className="flex items-center gap-2">
                <Label htmlFor="saleRepeatHours" className="text-sm">Repeat every</Label>
                <Input
                  id="saleRepeatHours"
                  type="number"
                  min="1"
                  value={saleRepeatHours}
                  onChange={(e) => setSaleRepeatHours(e.target.value)}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">hours</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 pt-2">
            <Checkbox
              id="freeShipping"
              checked={freeShipping}
              onCheckedChange={(c) => setFreeShipping(c === true)}
            />
            <Label htmlFor="freeShipping">
              Free shipping{" "}
              <span className="text-xs font-normal text-muted-foreground">
                — shows a &quot;Free Shipping&quot; badge and removes the shipping fee from the order.
              </span>
            </Label>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <Checkbox id="isActive" name="isActive" defaultChecked={initialData?.isActive ?? true} />
            <Label htmlFor="isActive">Active (visible on the site)</Label>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving…" : initialData ? "Update Offer" : "Create Offer"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
