import Link from "next/link";
import { ProductGrid } from "@/components/products/product-grid";

interface ProductSectionProps {
  eyebrow: string;
  title: string;
  href?: string;
  products: React.ComponentProps<typeof ProductGrid>["products"];
}

export function ProductSection({ eyebrow, title, href, products }: ProductSectionProps) {
  if (products.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
          {eyebrow}
        </p>
        <h2 className="mt-2 font-serif text-3xl font-bold sm:text-4xl">{title}</h2>
        {href && (
          <Link
            href={href}
            className="mt-3 inline-block text-sm font-medium text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
          >
            View all
          </Link>
        )}
      </div>
      <div className="mt-10">
        <ProductGrid products={products} />
      </div>
    </section>
  );
}
