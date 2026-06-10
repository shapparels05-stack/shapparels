import { db } from "@/lib/db";
import { products, productImages, categories } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { ProductGrid } from "@/components/products/product-grid";
import { getRatingSummaries } from "@/lib/db/queries/reviews";

export async function FeaturedProducts() {
  const featuredProducts = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      basePrice: products.basePrice,
      compareAtPrice: products.compareAtPrice,
      saleEndsAt: products.saleEndsAt,
      stock: products.stock,
      isFeatured: products.isFeatured,
      categoryName: categories.name,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(and(eq(products.isActive, true), eq(products.isFeatured, true)))
    .orderBy(desc(products.createdAt))
    .limit(8);

  const ratings = await getRatingSummaries(featuredProducts.map((p) => p.id));

  // Fetch images for each product
  const productsWithImages = await Promise.all(
    featuredProducts.map(async (product) => {
      const images = await db
        .select({ url: productImages.url, alt: productImages.alt })
        .from(productImages)
        .where(eq(productImages.productId, product.id))
        .orderBy(productImages.sortOrder)
        .limit(2);

      return {
        ...product,
        images,
        ratingAverage: ratings.get(product.id)?.average ?? 0,
        ratingCount: ratings.get(product.id)?.count ?? 0,
      };
    })
  );

  if (productsWithImages.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
          Handpicked for You
        </p>
        <h2 className="mt-2 font-serif text-3xl font-bold sm:text-4xl">
          Featured Products
        </h2>
      </div>
      <div className="mt-10">
        <ProductGrid products={productsWithImages} />
      </div>
    </section>
  );
}
