"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ImageUpload } from "./image-upload";

interface Category {
  id: string;
  name: string;
  parentId?: string | null;
  level?: number;
}

interface OptionTypeInput {
  name: string;
  values: { label: string; price: string; compareAtPrice: string; stock: string; sku: string }[];
}

interface ProductFormProps {
  categories: Category[];
  initialData?: any;
}

// Format a stored timestamp into the value a <input type="datetime-local">
// expects (local time, "YYYY-MM-DDTHH:mm").
function toDatetimeLocal(value: string | Date | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export function ProductForm({ categories, initialData }: ProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>(
    initialData?.images?.map((i: any) => i.url) || []
  );
  // Which colour each image belongs to (image url -> option value label).
  // "" = shown for all colours.
  const [imageColors, setImageColors] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const i of initialData?.images || []) {
      if (i.optionValue) map[i.url] = i.optionValue;
    }
    return map;
  });
  // Which saved variant's price represents this product in Best Sellers.
  const [bestSellerVariantId, setBestSellerVariantId] = useState<string>(
    initialData?.bestSellerVariantId || ""
  );
  const savedVariants: any[] = initialData?.variants || [];

  // Human label for a saved variant: its option combination (e.g. "Black / M")
  // and SKU, so it's identifiable in the Best Seller dropdown.
  const valueLabelById = new Map<string, string>();
  for (const ot of initialData?.optionTypes || []) {
    for (const v of ot.values || []) valueLabelById.set(v.id, v.value);
  }
  const variantLabel = (v: any) => {
    const opts = (v.optionValueIds || [])
      .map((id: string) => valueLabelById.get(id))
      .filter(Boolean)
      .join(" / ");
    const parts = [opts, v.sku].filter(Boolean);
    return parts.length ? parts.join(" · ") : "Variant";
  };

  // Build initial option types from existing data
  const buildInitialOptionTypes = (): OptionTypeInput[] => {
    if (!initialData?.optionTypes?.length) return [];

    return initialData.optionTypes.map((ot: any) => ({
      name: ot.name,
      values: ot.values.map((v: any) => {
        // Find the variant that matches this option value
        const matchingVariant = (initialData.variants || []).find((variant: any) =>
          (variant.optionValueIds ?? []).includes(v.id)
        );
        return {
          label: v.value,
          price: matchingVariant?.price || "",
          compareAtPrice: matchingVariant?.compareAtPrice || "",
          stock: matchingVariant?.stock?.toString() || "0",
          sku: matchingVariant?.sku || "",
        };
      }),
    }));
  };

  const [optionTypes, setOptionTypes] = useState<OptionTypeInput[]>(buildInitialOptionTypes());

  // Distinct colour/option value labels available to tag images with.
  const colorOptions = Array.from(
    new Set(
      optionTypes.flatMap((ot) => ot.values.map((v) => v.label.trim()).filter(Boolean))
    )
  );

  const generateSlug = (name: string) =>
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  const addOptionType = () => {
    setOptionTypes([...optionTypes, { name: "", values: [{ label: "", price: "", compareAtPrice: "", stock: "0", sku: "" }] }]);
  };

  const removeOptionType = (index: number) => {
    setOptionTypes(optionTypes.filter((_, i) => i !== index));
  };

  const addOptionValue = (typeIndex: number) => {
    const updated = [...optionTypes];
    updated[typeIndex].values.push({ label: "", price: "", compareAtPrice: "", stock: "0", sku: "" });
    setOptionTypes(updated);
  };

  const removeOptionValue = (typeIndex: number, valIndex: number) => {
    const updated = [...optionTypes];
    updated[typeIndex].values = updated[typeIndex].values.filter((_, i) => i !== valIndex);
    setOptionTypes(updated);
  };

  const updateOptionValue = (typeIndex: number, valIndex: number, field: string, value: string) => {
    const updated = [...optionTypes];
    (updated[typeIndex].values[valIndex] as any)[field] = value;
    setOptionTypes(updated);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    // Build option types and variants from the merged UI
    const cleanOptionTypes = optionTypes
      .filter((ot) => ot.name && ot.values.some((v) => v.label.trim()))
      .map((ot) => ({
        name: ot.name,
        values: ot.values.filter((v) => v.label.trim()).map((v) => v.label),
      }));

    // Each option value becomes a variant
    const variants = optionTypes
      .filter((ot) => ot.name && ot.values.some((v) => v.label.trim()))
      .flatMap((ot) =>
        ot.values
          .filter((v) => v.label.trim())
          .map((v) => ({
            sku: v.sku || null,
            price: parseFloat(v.price) || parseFloat(formData.get("basePrice") as string),
            compareAtPrice: v.compareAtPrice ? parseFloat(v.compareAtPrice) : null,
            stock: parseInt(v.stock) || 0,
            optionValueLabels: [`${ot.name}: ${v.label}`],
          }))
      );

    const data = {
      name: formData.get("name") as string,
      code: (formData.get("code") as string) || null,
      slug: formData.get("slug") as string,
      description: formData.get("description") as string,
      shortDescription: formData.get("shortDescription") as string,
      basePrice: parseFloat(formData.get("basePrice") as string),
      compareAtPrice: formData.get("compareAtPrice")
        ? parseFloat(formData.get("compareAtPrice") as string)
        : null,
      saleEndsAt: (formData.get("saleEndsAt") as string) || null,
      stock: parseInt(formData.get("stock") as string) || 0,
      categoryId: formData.get("categoryId") as string || null,
      metaTitle: formData.get("metaTitle") as string,
      metaDescription: formData.get("metaDescription") as string,
      isFeatured: formData.get("isFeatured") === "on",
      isBestSeller: formData.get("isBestSeller") === "on",
      bestSellerVariantId: bestSellerVariantId || null,
      isActive: formData.get("isActive") === "on",
      tags: (formData.get("tags") as string)
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      images: images.map((url) => ({ url, optionValue: imageColors[url] || null })),
      optionTypes: cleanOptionTypes,
      variants,
    };

    try {
      const url = initialData
        ? `/api/products/${initialData.id}`
        : "/api/products";
      const method = initialData ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Failed to save product");
        return;
      }

      toast.success(initialData ? "Product updated" : "Product created");
      router.push("/admin/products");
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
          <CardTitle className="font-serif">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="code">Product Code</Label>
              <Input
                id="code"
                name="code"
                placeholder="e.g. SH-001"
                defaultValue={initialData?.code}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                name="name"
                required
                defaultValue={initialData?.name}
                onChange={(e) => {
                  if (!initialData) {
                    const slugInput = document.getElementById("slug") as HTMLInputElement;
                    if (slugInput) slugInput.value = generateSlug(e.target.value);
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input id="slug" name="slug" required defaultValue={initialData?.slug} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shortDescription">Short Description</Label>
            <Input
              id="shortDescription"
              name="shortDescription"
              defaultValue={initialData?.shortDescription}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Full Description</Label>
            <Textarea
              id="description"
              name="description"
              rows={5}
              defaultValue={initialData?.description}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif">Pricing &amp; Inventory</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="basePrice">Base Price (PKR) *</Label>
            <Input
              id="basePrice"
              name="basePrice"
              type="number"
              step="0.01"
              required
              defaultValue={initialData?.basePrice}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="compareAtPrice">Compare At Price (PKR)</Label>
            <Input
              id="compareAtPrice"
              name="compareAtPrice"
              type="number"
              step="0.01"
              defaultValue={initialData?.compareAtPrice}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="stock">Base Stock Quantity</Label>
            <Input
              id="stock"
              name="stock"
              type="number"
              min="0"
              defaultValue={initialData?.stock ?? 0}
            />
            <p className="text-xs text-muted-foreground">Used when no variants are added</p>
          </div>
          <div className="space-y-2 sm:col-span-3">
            <Label htmlFor="saleEndsAt">Limited-Time Offer Ends</Label>
            <Input
              id="saleEndsAt"
              name="saleEndsAt"
              type="datetime-local"
              defaultValue={toDatetimeLocal(initialData?.saleEndsAt)}
            />
            <p className="text-xs text-muted-foreground">
              Optional. When set with a Compare At Price, a countdown shows and the
              discount expires automatically at this time. Leave blank for a permanent markdown.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif">Organization</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="categoryId">Category</Label>
            <Select name="categoryId" defaultValue={initialData?.categoryId || ""}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {buildOrderedCategories(categories).map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma separated)</Label>
            <Input
              id="tags"
              name="tags"
              defaultValue={initialData?.tags?.join(", ")}
              placeholder="e.g. new arrival, summer, trending"
            />
          </div>

          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <Checkbox
                id="isFeatured"
                name="isFeatured"
                defaultChecked={initialData?.isFeatured}
              />
              <Label htmlFor="isFeatured">Featured Product</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="isBestSeller"
                name="isBestSeller"
                defaultChecked={initialData?.isBestSeller}
              />
              <Label htmlFor="isBestSeller">Best Seller</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="isActive"
                name="isActive"
                defaultChecked={initialData?.isActive ?? true}
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
          </div>

          {savedVariants.length > 0 && (
            <div className="space-y-2">
              <Label>Best Seller price variant</Label>
              <Select
                value={bestSellerVariantId || "base"}
                onValueChange={(v) => setBestSellerVariantId(v === "base" ? "" : v)}
              >
                <SelectTrigger className="sm:w-80">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="base">Base price (default)</SelectItem>
                  {savedVariants.map((v: any) => (
                    <SelectItem key={v.id} value={v.id}>
                      {variantLabel(v)} — Rs. {Number(v.price).toLocaleString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Which variant&apos;s price shows on the Best Sellers card. Re-pick if you edit variants (their IDs change on save).
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif">Images</CardTitle>
        </CardHeader>
        <CardContent>
          <ImageUpload images={images} onChange={setImages} />

          {images.length > 0 && colorOptions.length > 0 && (
            <div className="mt-5 space-y-2">
              <p className="text-sm font-medium">Assign images to a colour (optional)</p>
              <p className="text-xs text-muted-foreground">
                When a customer selects a colour, only that colour&apos;s images show.
                &quot;All colours&quot; images always show. Leave as-is to keep current behaviour.
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {images.map((url) => (
                  <div key={url} className="flex items-center gap-2 rounded-md border border-border/50 p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="h-12 w-12 shrink-0 rounded object-cover" />
                    <select
                      value={imageColors[url] || ""}
                      onChange={(e) =>
                        setImageColors((m) => ({ ...m, [url]: e.target.value }))
                      }
                      className="flex-1 rounded-md border border-border bg-background px-2 py-1 text-sm"
                    >
                      <option value="">All colours</option>
                      {colorOptions.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-serif">Product Variants</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Add options like Color or Size. Each value gets its own stock and optional price.
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addOptionType}>
            <Plus className="mr-2 h-4 w-4" />
            Add Option
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {optionTypes.map((ot, typeIndex) => (
            <div key={typeIndex} className="rounded-md border border-border/50 p-4 space-y-4">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Option name (e.g. Color, Size)"
                  value={ot.name}
                  onChange={(e) => {
                    const updated = [...optionTypes];
                    updated[typeIndex].name = e.target.value;
                    setOptionTypes(updated);
                  }}
                  className="flex-1 font-medium"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeOptionType(typeIndex)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>

              <Separator />

              <div className="space-y-3">
                {ot.values.map((val, valIndex) => (
                  <div key={valIndex} className="grid gap-3 sm:grid-cols-5 items-end">
                    <div className="space-y-1">
                      <Label className="text-xs">Value *</Label>
                      <Input
                        placeholder={ot.name ? `e.g. ${ot.name === "Color" ? "Red" : ot.name === "Size" ? "Large" : "Value"}` : "Value"}
                        value={val.label}
                        onChange={(e) => updateOptionValue(typeIndex, valIndex, "label", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Price (PKR)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Use base"
                        value={val.price}
                        onChange={(e) => updateOptionValue(typeIndex, valIndex, "price", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Stock *</Label>
                      <Input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={val.stock}
                        onChange={(e) => updateOptionValue(typeIndex, valIndex, "stock", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">SKU</Label>
                      <Input
                        placeholder="Optional"
                        value={val.sku}
                        onChange={(e) => updateOptionValue(typeIndex, valIndex, "sku", e.target.value)}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="self-end"
                      onClick={() => removeOptionValue(typeIndex, valIndex)}
                      disabled={ot.values.length <= 1}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addOptionValue(typeIndex)}
              >
                <Plus className="mr-2 h-3 w-3" />
                Add Value
              </Button>
            </div>
          ))}
          {optionTypes.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No variants added. Product will use the base price and stock above.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif">SEO</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="metaTitle">Meta Title</Label>
            <Input id="metaTitle" name="metaTitle" defaultValue={initialData?.metaTitle} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="metaDescription">Meta Description</Label>
            <Textarea
              id="metaDescription"
              name="metaDescription"
              rows={2}
              defaultValue={initialData?.metaDescription}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : initialData ? "Update Product" : "Create Product"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function buildOrderedCategories(categories: Category[]): (Category & { displayName: string })[] {
  const map = new Map<string | null, Category[]>();
  for (const cat of categories) {
    const key = cat.parentId ?? null;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(cat);
  }

  const result: (Category & { displayName: string })[] = [];
  const addChildren = (parentId: string | null, prefix: string) => {
    const children = map.get(parentId) || [];
    for (const child of children) {
      result.push({ ...child, displayName: prefix ? `${prefix} > ${child.name}` : child.name });
      addChildren(child.id, prefix ? `${prefix} > ${child.name}` : child.name);
    }
  };
  addChildren(null, "");
  return result;
}
