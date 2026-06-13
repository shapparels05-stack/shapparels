"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  level?: number;
}

interface ProductFiltersProps {
  categories: Category[];
}

function getIndentLabel(cat: Category, all: Category[]): string {
  const prefix = "\u00A0\u00A0".repeat(cat.level ?? 0);
  return prefix + cat.name;
}

export function ProductFilters({ categories }: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedCategory = searchParams.get("category") || "";
  const minPrice = Number(searchParams.get("minPrice")) || 0;
  const maxPrice = Number(searchParams.get("maxPrice")) || 50000;

  // Local state so the slider thumb moves while dragging (a controlled slider
  // with only onValueCommit can't move). Synced from the URL when it changes.
  const [range, setRange] = useState<[number, number]>([minPrice, maxPrice]);
  useEffect(() => {
    setRange([minPrice, maxPrice]);
  }, [minPrice, maxPrice]);

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      router.push(`/products?${params.toString()}`);
    },
    [router, searchParams]
  );

  const clearFilters = () => {
    router.push("/products");
  };

  // Build ordered flat list respecting hierarchy
  const orderedCategories = buildOrderedList(categories);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-serif text-sm font-semibold">Categories</h3>
        <div className="mt-3 space-y-2">
          {orderedCategories.map((cat) => (
            <div key={cat.id} className="flex items-center gap-2" style={{ paddingLeft: (cat.level ?? 0) * 16 }}>
              <Checkbox
                id={`cat-${cat.id}`}
                checked={selectedCategory === cat.id}
                onCheckedChange={(checked) =>
                  updateFilter("category", checked ? cat.id : "")
                }
              />
              <Label
                htmlFor={`cat-${cat.id}`}
                className="text-sm text-muted-foreground cursor-pointer"
              >
                {cat.name}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="font-serif text-sm font-semibold">Price Range</h3>
        <div className="mt-3">
          <Slider
            min={0}
            max={50000}
            step={500}
            value={range}
            onValueChange={(value) => setRange([value[0], value[1]])}
            onValueCommit={(value) => {
              // Set both bounds in ONE push — two sequential pushes from the
              // same stale searchParams would clobber each other.
              const params = new URLSearchParams(searchParams.toString());
              if (value[0] > 0) params.set("minPrice", value[0].toString());
              else params.delete("minPrice");
              if (value[1] < 50000) params.set("maxPrice", value[1].toString());
              else params.delete("maxPrice");
              params.delete("page");
              router.push(`/products?${params.toString()}`);
            }}
          />
          <div className="mt-2 flex justify-between text-xs text-muted-foreground">
            <span>Rs. {range[0].toLocaleString()}</span>
            <span>Rs. {range[1].toLocaleString()}</span>
          </div>
        </div>
      </div>

      <Separator />

      <Button variant="outline" size="sm" onClick={clearFilters} className="w-full">
        Clear Filters
      </Button>
    </div>
  );
}

function buildOrderedList(categories: Category[]): Category[] {
  const map = new Map<string | null, Category[]>();
  for (const cat of categories) {
    const key = cat.parentId ?? null;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(cat);
  }

  const result: Category[] = [];
  const addChildren = (parentId: string | null) => {
    const children = map.get(parentId) || [];
    for (const child of children) {
      result.push(child);
      addChildren(child.id);
    }
  };
  addChildren(null);
  return result;
}
