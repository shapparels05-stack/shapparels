import { getNewArrivals } from "@/lib/db/queries/products";
import { ProductSection } from "./product-section";

export async function NewArrivals() {
  const products = await getNewArrivals(8);

  return (
    <ProductSection
      eyebrow="Just In"
      title="New Arrivals"
      href="/products?sort=newest"
      products={products}
    />
  );
}
