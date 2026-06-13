import { getProductsGroupedByCategory } from "@/lib/db/queries/products";
import { ProductCarousel } from "@/components/products/product-carousel";

export async function BestSellers() {
  const groups = await getProductsGroupedByCategory({
    perCategory: 12,
    maxCategories: 6,
    bestSellerOnly: true,
  });
  if (groups.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
          Most Loved
        </p>
        <h2 className="mt-2 font-serif text-3xl font-bold sm:text-4xl">Best Sellers</h2>
      </div>

      {/* One row per category, no per-row label (row 1 = first category, etc.) */}
      <div className="mt-10 space-y-10">
        {groups.map((group) => (
          <ProductCarousel key={group.category.id} products={group.products} />
        ))}
      </div>
    </section>
  );
}
