import Link from "next/link";
import { getProductsGroupedByCategory } from "@/lib/db/queries/products";
import { ProductCarousel } from "@/components/products/product-carousel";

export async function BrowseByCategory() {
  const groups = await getProductsGroupedByCategory({ perCategory: 12, maxCategories: 6 });
  if (groups.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
          Shop the Collection
        </p>
        <h2 className="mt-2 font-serif text-3xl font-bold sm:text-4xl">Browse by Category</h2>
      </div>

      <div className="mt-10 space-y-12">
        {groups.map((group) => (
          <div key={group.category.id}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-serif text-xl font-semibold">{group.category.name}</h3>
              <Link
                href={`/category/${group.category.slug}`}
                className="text-sm text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
              >
                View all
              </Link>
            </div>
            <ProductCarousel products={group.products} />
          </div>
        ))}
      </div>
    </section>
  );
}
