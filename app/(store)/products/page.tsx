import { Suspense } from "react";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getProducts } from "@/lib/db/queries/products";
import { getCategories } from "@/lib/db/queries/categories";
import { ProductGrid } from "@/components/products/product-grid";
import { ProductFilters } from "@/components/products/product-filters";
import { SortSelect } from "@/components/products/sort-select";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Skeleton } from "@/components/ui/skeleton";
import { SITE_URL } from "@/lib/constants";

// Render per-request so legacy ?category= redirects and filters always apply.
export const dynamic = "force-dynamic";

interface ProductsPageProps {
  searchParams: Promise<{
    category?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
    page?: string;
  }>;
}

export async function generateMetadata({ searchParams }: ProductsPageProps): Promise<Metadata> {
  const sp = await searchParams;
  // Refined views (filter/sort/page) point back to the clean /products page.
  const isRefined = Boolean(sp.minPrice || sp.maxPrice || sp.sort || (sp.page && sp.page !== "1"));
  return {
    title: "Shop All Products – Bags, Jewelry & More in Pakistan",
    description:
      "Browse the full SH Apparels collection — bags, jewelry, cosmetics, accessories and clothing. Cash on Delivery across Pakistan including Lahore.",
    alternates: { canonical: `${SITE_URL}/products` },
    robots: isRefined ? { index: false, follow: true } : { index: true, follow: true },
  };
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;

  // Legacy ?category=<id> URLs → redirect to the clean, indexable category page.
  if (params.category) {
    const cats = await getCategories();
    const match = cats.find((c) => c.id === params.category);
    if (match) redirect(`/category/${match.slug}`);
  }

  const categories = await getCategories();

  const { products, total, page, totalPages } = await getProducts({
    minPrice: params.minPrice ? Number(params.minPrice) : undefined,
    maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
    sortBy: (params.sort as never) || "newest",
    page: params.page ? Number(params.page) : 1,
  });

  const pageHref = (p: number) => {
    const q = new URLSearchParams();
    if (params.minPrice) q.set("minPrice", params.minPrice);
    if (params.maxPrice) q.set("maxPrice", params.maxPrice);
    if (params.sort) q.set("sort", params.sort);
    if (p > 1) q.set("page", p.toString());
    const qs = q.toString();
    return qs ? `/products?${qs}` : "/products";
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ label: "Shop" }]} />

      <div className="mt-6 flex flex-col gap-8 lg:flex-row">
        <aside className="hidden w-64 shrink-0 lg:block">
          <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <ProductFilters categories={categories} basePath="/products" />
          </Suspense>
        </aside>

        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {total} {total === 1 ? "product" : "products"}
            </p>
            <Suspense fallback={null}>
              <SortSelect basePath="/products" />
            </Suspense>
          </div>

          <div className="mt-6">
            <ProductGrid products={products} />
          </div>

          {totalPages > 1 && (
            <div className="mt-8 flex justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={pageHref(p)}
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
