import { Metadata } from "next";
import { db } from "@/lib/db";
import { products, productImages, categories } from "@/lib/db/schema";
import { eq, and, or, ilike, desc, inArray } from "drizzle-orm";
import { ProductGrid } from "@/components/products/product-grid";
import { getRatingSummaries } from "@/lib/db/queries/reviews";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const { q } = await searchParams;
  return {
    title: q ? `Search: ${q}` : "Search",
    robots: { index: false },
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;

  let searchResults: any[] = [];

  if (q && q.trim()) {
    const searchTerm = `%${q.trim()}%`;

    const results = await db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        basePrice: products.basePrice,
        compareAtPrice: products.compareAtPrice,
        stock: products.stock,
        isFeatured: products.isFeatured,
        categoryName: categories.name,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(
        and(
          eq(products.isActive, true),
          or(
            ilike(products.name, searchTerm),
            ilike(products.description, searchTerm),
            ilike(products.shortDescription, searchTerm)
          )
        )
      )
      .orderBy(desc(products.createdAt))
      .limit(50);

    const productIds = results.map((p) => p.id);
    const images =
      productIds.length > 0
        ? await db
            .select({
              productId: productImages.productId,
              url: productImages.url,
              alt: productImages.alt,
            })
            .from(productImages)
            .where(inArray(productImages.productId, productIds))
            .orderBy(productImages.sortOrder)
        : [];

    const imagesByProduct = new Map<string, { url: string; alt: string | null }[]>();
    for (const img of images) {
      const existing = imagesByProduct.get(img.productId) || [];
      existing.push({ url: img.url, alt: img.alt });
      imagesByProduct.set(img.productId, existing);
    }

    const ratings = await getRatingSummaries(productIds);

    searchResults = results.map((p) => ({
      ...p,
      images: imagesByProduct.get(p.id) || [],
      ratingAverage: ratings.get(p.id)?.average ?? 0,
      ratingCount: ratings.get(p.id)?.count ?? 0,
    }));
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ label: "Search" }]} />

      <div className="mt-6">
        <h1 className="font-serif text-3xl font-bold">
          {q ? `Results for "${q}"` : "Search"}
        </h1>
        {q && (
          <p className="mt-2 text-sm text-muted-foreground">
            {searchResults.length} {searchResults.length === 1 ? "product" : "products"} found
          </p>
        )}
      </div>

      <div className="mt-8">
        {!q ? (
          <p className="text-center text-muted-foreground py-12">
            Use the search bar above to find products.
          </p>
        ) : (
          <ProductGrid products={searchResults} />
        )}
      </div>
    </div>
  );
}
