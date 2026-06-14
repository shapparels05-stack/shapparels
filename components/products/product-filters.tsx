"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
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
  // Where price/sort/clear push to (e.g. "/products" or "/category/bags").
  basePath?: string;
  // Slug of the category currently being viewed (for active highlight).
  currentCategorySlug?: string;
}

export function ProductFilters({
  categories,
  basePath = "/products",
  currentCategorySlug,
}: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const minPrice = Number(searchParams.get("minPrice")) || 0;
  const maxPrice = Number(searchParams.get("maxPrice")) || 50000;

  // Local state so the slider thumb moves while dragging.
  const [range, setRange] = useState<[number, number]>([minPrice, maxPrice]);
  useEffect(() => {
    setRange([minPrice, maxPrice]);
  }, [minPrice, maxPrice]);

  const orderedCategories = buildOrderedList(categories);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-serif text-sm font-semibold">Categories</h3>
        <div className="mt-3 space-y-1">
          {/* Clean, indexable category links (good for SEO) instead of ?category= */}
          {orderedCategories.map((cat) => {
            const active = currentCategorySlug === cat.slug;
            return (
              <Link
                key={cat.id}
                href={`/category/${cat.slug}`}
                style={{ paddingLeft: (cat.level ?? 0) * 16 }}
                className={`block rounded px-1 py-1 text-sm transition-colors hover:text-primary ${
                  active ? "font-medium text-primary" : "text-muted-foreground"
                }`}
              >
                {cat.name}
              </Link>
            );
          })}
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
              // Set both bounds in ONE push so they don't clobber each other.
              const params = new URLSearchParams(searchParams.toString());
              if (value[0] > 0) params.set("minPrice", value[0].toString());
              else params.delete("minPrice");
              if (value[1] < 50000) params.set("maxPrice", value[1].toString());
              else params.delete("maxPrice");
              params.delete("page");
              const qs = params.toString();
              router.push(qs ? `${basePath}?${qs}` : basePath);
            }}
          />
          <div className="mt-2 flex justify-between text-xs text-muted-foreground">
            <span>Rs. {range[0].toLocaleString()}</span>
            <span>Rs. {range[1].toLocaleString()}</span>
          </div>
        </div>
      </div>

      <Separator />

      <Button
        variant="outline"
        size="sm"
        onClick={() => router.push(basePath)}
        className="w-full"
      >
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
