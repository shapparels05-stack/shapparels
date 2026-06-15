"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useQueryState, parseAsString, parseAsArrayOf } from "nuqs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X, Edit, Package, Loader2 } from "lucide-react";
import { CURRENCY_SYMBOL } from "@/lib/constants";
import { ArchiveProductButton } from "@/components/admin/archive-product-button";
import { CategoryMultiSelect, type CategoryOption } from "@/components/admin/category-multi-select";

interface ProductRow {
  id: string;
  name: string;
  code: string | null;
  slug: string;
  basePrice: string;
  isActive: boolean;
  isFeatured: boolean;
  categoryName: string | null;
  image: string | null;
  totalStock: number;
}

export function AdminProductsList({ categories }: { categories: CategoryOption[] }) {
  const [q, setQ] = useQueryState("q", parseAsString.withDefault(""));
  const [status, setStatus] = useQueryState("status", parseAsString.withDefault("all"));
  const [cats, setCats] = useQueryState("categories", parseAsArrayOf(parseAsString).withDefault([]));

  const [items, setItems] = useState<ProductRow[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);

  // Stable string key for the array so effects don't loop on identity changes.
  const catKey = cats.join(",");

  const fetchPage = useCallback(
    async (pageNum: number, replace: boolean) => {
      setLoading(true);
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (status && status !== "all") params.set("status", status);
      if (catKey) params.set("categories", catKey);
      params.set("page", String(pageNum));
      try {
        const res = await fetch(`/api/admin/products?${params.toString()}`);
        const data = await res.json();
        setItems((prev) => (replace ? data.items : [...prev, ...data.items]));
        setHasMore(Boolean(data.hasMore));
        setPage(pageNum);
      } catch {
        /* keep existing list */
      } finally {
        setLoading(false);
      }
    },
    [q, status, catKey]
  );

  // Reload from page 1 whenever a filter changes.
  useEffect(() => {
    fetchPage(1, true);
  }, [fetchPage]);

  // Infinite scroll.
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loading) fetchPage(page + 1, false);
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, loading, page, fetchPage]);

  // Debounced search input (name or code).
  const [searchInput, setSearchInput] = useState(q);
  useEffect(() => {
    const id = setTimeout(() => {
      if (searchInput !== q) setQ(searchInput || null);
    }, 350);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-wrap">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name or code..."
            className="pl-9 pr-9"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <CategoryMultiSelect
          options={categories}
          value={cats}
          onChange={(v) => setCats(v.length ? v : null)}
        />

        <Select value={status} onValueChange={(v) => setStatus(v === "all" ? null : v)}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading && items.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Loading products...</p>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Package className="h-12 w-12 text-muted-foreground/30" />
          <p className="mt-4 text-muted-foreground">No products match your filters</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((product) => (
            <div
              key={product.id}
              className={`group flex items-center gap-4 rounded-lg border border-border/50 p-4 transition-colors hover:bg-accent ${
                !product.isActive ? "opacity-60" : ""
              }`}
            >
              <Link
                href={`/admin/products/${product.id}/edit`}
                className="flex min-w-0 flex-1 items-center gap-4"
              >
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-border/50 bg-card">
                  {product.image ? (
                    <Image src={product.image} alt={product.name} fill className="object-cover" sizes="64px" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                      No img
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {product.code ? `${product.code} · ` : ""}
                    {product.categoryName || "No category"} · Stock: {product.totalStock}
                  </p>
                </div>
              </Link>

              <div className="hidden items-center gap-2 sm:flex">
                {!product.isActive && <Badge variant="secondary">Archived</Badge>}
                {product.isFeatured && <Badge className="bg-primary/10 text-primary">Featured</Badge>}
              </div>

              <div className="text-right">
                <p className="font-medium">
                  {CURRENCY_SYMBOL} {parseFloat(product.basePrice).toLocaleString()}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <ArchiveProductButton
                  productId={product.id}
                  isActive={product.isActive}
                  onChanged={() => fetchPage(1, true)}
                />
                <Link
                  href={`/admin/products/${product.id}/edit`}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
                  title="Edit product"
                >
                  <Edit className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}

          {/* Infinite-scroll sentinel */}
          <div ref={sentinelRef} className="h-10" />
          {loading && items.length > 0 && (
            <div className="flex justify-center py-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
