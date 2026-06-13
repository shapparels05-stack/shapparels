import { getNewArrivals } from "@/lib/db/queries/products";
import { ProductCarousel } from "@/components/products/product-carousel";

export async function NewArrivals() {
  const products = await getNewArrivals(12);
  if (products.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
          Just In
        </p>
        <h2 className="mt-2 font-serif text-3xl font-bold sm:text-4xl">New Arrivals</h2>
      </div>
      <div className="mt-10">
        <ProductCarousel products={products} />
      </div>
    </section>
  );
}
