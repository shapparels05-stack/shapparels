import { getLimitedTimeDeals } from "@/lib/db/queries/products";
import { ProductSection } from "./product-section";

export async function LimitedTimeDeals() {
  const products = await getLimitedTimeDeals(8);

  return (
    <ProductSection
      eyebrow="Hurry, While It Lasts"
      title="Limited-Time Deals"
      href="/products"
      products={products}
    />
  );
}
