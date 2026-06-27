import { ProductCard } from "./product-card";

interface Product {
  id: string;
  name: string;
  slug: string;
  basePrice: string;
  compareAtPrice: string | null;
  saleEndsAt?: Date | string | null;
  saleRepeatHours?: number | null;
  stock: number;
  isFeatured: boolean;
  categoryName?: string | null;
  images: { url: string; alt: string | null }[];
  ratingAverage?: number;
  ratingCount?: number;
}

interface ProductGridProps {
  products: Product[];
}

export function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="font-serif text-xl text-muted-foreground">
          No products found
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Check back later for new arrivals.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
