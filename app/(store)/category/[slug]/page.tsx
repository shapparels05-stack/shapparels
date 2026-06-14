import { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getProducts } from "@/lib/db/queries/products";
import {
  getCategoryBySlug,
  getCategoryWithAncestors,
  getDescendantIds,
  getCategories,
} from "@/lib/db/queries/categories";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { ProductGrid } from "@/components/products/product-grid";
import { ProductFilters } from "@/components/products/product-filters";
import { SortSelect } from "@/components/products/sort-select";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { BreadcrumbJsonLd } from "@/components/shared/breadcrumb-jsonld";
import { Skeleton } from "@/components/ui/skeleton";
import { SITE_URL } from "@/lib/constants";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
    page?: string;
  }>;
}

export async function generateMetadata({ params, searchParams }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const sp = await searchParams;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "Category Not Found" };

  const canonical = `${SITE_URL}/category/${slug}`;
  // Don't index filtered/sorted/paged variants — they're refinements of the
  // canonical category page (avoids duplicate content), but still crawlable.
  const isRefined = Boolean(sp.minPrice || sp.maxPrice || sp.sort || (sp.page && sp.page !== "1"));

  return {
    title: `${category.name} – Buy Online in Pakistan`,
    description:
      category.description ||
      `Shop ${category.name} at SH Apparels. Premium quality with Cash on Delivery across Pakistan including Lahore, Karachi and Islamabad.`,
    alternates: { canonical },
    robots: isRefined ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: {
      title: `${category.name} – SH Apparels`,
      description: category.description || `Shop ${category.name} with Cash on Delivery across Pakistan.`,
      url: canonical,
      images: category.image ? [{ url: category.image }] : [],
    },
  };
}

export async function generateStaticParams() {
  try {
    const all = await getCategories();
    return all.map((c) => ({ slug: c.slug }));
  } catch {
    return [];
  }
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const sp = await searchParams;

  const result = await getCategoryWithAncestors(slug);
  if (!result) notFound();
  const { category, ancestors } = result;

  const [descendantIds, subcategories, allCategories] = await Promise.all([
    getDescendantIds(category.id),
    db
      .select()
      .from(categories)
      .where(eq(categories.parentId, category.id))
      .orderBy(asc(categories.sortOrder)),
    getCategories(),
  ]);

  const { products, total, page, totalPages } = await getProducts({
    categoryIds: descendantIds,
    minPrice: sp.minPrice ? Number(sp.minPrice) : undefined,
    maxPrice: sp.maxPrice ? Number(sp.maxPrice) : undefined,
    sortBy: (sp.sort as never) || "newest",
    page: sp.page ? Number(sp.page) : 1,
  });

  const activeSubcategories = subcategories.filter((c) => c.isActive);

  const breadcrumbItems = [
    { label: "Shop", href: "/products" },
    ...ancestors.map((a) => ({ label: a.name, href: `/category/${a.slug}` })),
    { label: category.name },
  ];

  const pageHref = (p: number) => {
    const params = new URLSearchParams();
    if (sp.minPrice) params.set("minPrice", sp.minPrice);
    if (sp.maxPrice) params.set("maxPrice", sp.maxPrice);
    if (sp.sort) params.set("sort", sp.sort);
    if (p > 1) params.set("page", p.toString());
    const qs = params.toString();
    return qs ? `/category/${slug}?${qs}` : `/category/${slug}`;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <Breadcrumbs items={breadcrumbItems} />

      <div className="mt-6">
        <h1 className="font-serif text-3xl font-bold sm:text-4xl">{category.name}</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          {category.description ||
            `Shop our ${category.name} collection at SH Apparels — premium quality with Cash on Delivery across Pakistan, including Lahore, Karachi and Islamabad.`}
        </p>
      </div>

      {/* Subcategories (internal links help SEO + browsing) */}
      {activeSubcategories.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {activeSubcategories.map((sub) => (
            <Link
              key={sub.id}
              href={`/category/${sub.slug}`}
              className="rounded-full border border-border px-3 py-1 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              {sub.name}
            </Link>
          ))}
        </div>
      )}

      <div className="mt-8 flex flex-col gap-8 lg:flex-row">
        <aside className="hidden w-64 shrink-0 lg:block">
          <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <ProductFilters
              categories={allCategories}
              basePath={`/category/${slug}`}
              currentCategorySlug={slug}
            />
          </Suspense>
        </aside>

        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {total} {total === 1 ? "product" : "products"}
            </p>
            <Suspense fallback={null}>
              <SortSelect basePath={`/category/${slug}`} />
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
