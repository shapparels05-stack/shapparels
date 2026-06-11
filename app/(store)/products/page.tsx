import { Suspense } from "react";
import { Metadata } from "next";
import { getProducts } from "@/lib/db/queries/products";
import { getCategories } from "@/lib/db/queries/categories";
import { ProductGrid } from "@/components/products/product-grid";
import { ProductFilters } from "@/components/products/product-filters";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Shop All Products",
  description:
    "Browse our complete collection of premium ladies beauty products including bags, jewelry, cosmetics, accessories and clothing.",
};

interface ProductsPageProps {
  searchParams: Promise<{
    category?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
    page?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;

  const [{ products, total, page, totalPages }, categories] = await Promise.all([
    getProducts({
      categoryId: params.category,
      minPrice: params.minPrice ? Number(params.minPrice) : undefined,
      maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
      sortBy: (params.sort as any) || "newest",
      page: params.page ? Number(params.page) : 1,
    }),
    getCategories(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ label: "Shop" }]} />

      <div className="mt-6 flex flex-col gap-8 lg:flex-row">
        {/* Sidebar Filters */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <ProductFilters categories={categories} />
          </Suspense>
        </aside>

        {/* Main Content */}
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {total} {total === 1 ? "product" : "products"}
            </p>
            <SortSelect current={params.sort} />
          </div>

          <div className="mt-6">
            <ProductGrid products={products} />
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={`/products?${new URLSearchParams({
                    ...params,
                    page: p.toString(),
                  }).toString()}`}
                  className={`flex h-9 w-9 items-center justify-center rounded-md text-sm ${
                    p === page
                      ? "bg-primary text-primary-foreground"
                      : "border border-border hover:bg-accent"
                  }`}
                >
                  {p}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SortSelect({ current }: { current?: string }) {
  return (
    <form>
      <Select name="sort" defaultValue={current || "newest"}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">Newest</SelectItem>
          <SelectItem value="price-asc">Price: Low to High</SelectItem>
          <SelectItem value="price-desc">Price: High to Low</SelectItem>
          <SelectItem value="name">Name</SelectItem>
        </SelectContent>
      </Select>
    </form>
  );
}
