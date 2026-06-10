import { getBestSellers } from "@/lib/db/queries/products";
import { ProductSection } from "./product-section";

export async function BestSellers() {
  const products = await getBestSellers(8);

  return (
    <ProductSection
      eyebrow="Most Loved"
      title="Best Sellers"
      href="/products"
      products={products}
    />
  );
}
