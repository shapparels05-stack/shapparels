import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getProductBySlug, getRelatedProducts } from "@/lib/db/queries/products";
import { getProductRatingSummary } from "@/lib/db/queries/reviews";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { RatingSummary } from "@/components/reviews/rating-summary";
import { ProductReviews } from "@/components/reviews/product-reviews";
import { bucketDiscountPercent, activeCompareAtPrice } from "@/lib/pricing";
import { ProductImages } from "@/components/products/product-images";
import { ProductTrustBadges } from "@/components/products/product-trust-badges";
import { CategoryGrid } from "@/components/home/category-grid";
import { ProductDetailClient } from "./product-detail-client";
import { ProductJsonLd } from "@/components/shared/product-jsonld";
import { ProductGrid } from "@/components/products/product-grid";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SITE_URL } from "@/lib/constants";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) return { title: "Product Not Found" };

  const displayName = product.code ? `${product.code} - ${product.name}` : product.name;

  return {
    title: product.metaTitle || displayName,
    description: product.metaDescription || product.shortDescription || product.description?.slice(0, 160),
    openGraph: {
      title: product.metaTitle || displayName,
      description: product.metaDescription || product.shortDescription || "",
      images: product.images[0] ? [{ url: product.images[0].url }] : [],
    },
  };
}

export const revalidate = 3600;

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  const [relatedProducts, ratingSummary] = await Promise.all([
    getRelatedProducts(product.id, product.categoryId, 48),
    getProductRatingSummary(product.id),
  ]);

  const breadcrumbItems = [
    { label: "Shop", href: "/products" },
    ...(product.category
      ? [{ label: product.category.name, href: `/category/${product.category.slug}` }]
      : []),
    { label: product.name },
  ];

  // Discount percent shown over the main image, matching the card badge.
  // An expired limited-time offer drops the discount entirely.
  const basePrice = parseFloat(product.basePrice);
  const rawCompareAt = product.compareAtPrice ? parseFloat(product.compareAtPrice) : null;
  const compareAt = activeCompareAtPrice(rawCompareAt, product.saleEndsAt);
  const discountPercent =
    product.stock > 0 ? bucketDiscountPercent(basePrice, compareAt) : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <ProductJsonLd product={product} siteUrl={SITE_URL} rating={ratingSummary} />
      <Breadcrumbs items={breadcrumbItems} />

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        {/* Images */}
        <ProductImages
          images={product.images}
          productName={product.name}
          discountPercent={discountPercent}
          code={product.code}
        />

        {/* Product Info */}
        <div>
          {product.category && (
            <p className="text-sm font-medium uppercase tracking-wider text-primary">
              {product.category.name}
            </p>
          )}
          <h1 className="mt-1 font-serif text-3xl font-bold sm:text-4xl">
            {product.name}
          </h1>

          <a href="#reviews" className="mt-3 inline-block">
            <RatingSummary average={ratingSummary.average} count={ratingSummary.count} />
          </a>

          {product.shortDescription && (
            <p className="mt-3 text-muted-foreground">
              {product.shortDescription}
            </p>
          )}

          {/* Client component for interactive variant selection + cart */}
          <ProductDetailClient
            product={{
              id: product.id,
              name: product.name,
              slug: product.slug,
              basePrice: product.basePrice,
              compareAtPrice: product.compareAtPrice,
              saleEndsAt: product.saleEndsAt,
              stock: product.stock,
              image: product.images[0]?.url || "",
            }}
            optionTypes={product.optionTypes}
            variants={product.variants}
          />

          <ProductTrustBadges />
        </div>
      </div>

      {/* Description / Details / Reviews Tabs */}
      <div id="reviews" className="mt-12 scroll-mt-24">
        <Tabs defaultValue={product.description ? "description" : "reviews"}>
          <TabsList>
            {product.description && (
              <TabsTrigger value="description">Description</TabsTrigger>
            )}
            <TabsTrigger value="reviews">
              Reviews{ratingSummary.count > 0 ? ` (${ratingSummary.count})` : ""}
            </TabsTrigger>
          </TabsList>

          {product.description && (
            <TabsContent value="description" className="mt-4 space-y-4">
              <div className="prose prose-invert max-w-none whitespace-pre-wrap text-muted-foreground">
                {product.description}
              </div>
            </TabsContent>
          )}

          <TabsContent value="reviews" className="mt-6">
            <ProductReviews
              productId={product.id}
              initialAverage={ratingSummary.average}
              initialCount={ratingSummary.count}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-16">
          <h2 className="font-serif text-2xl font-bold">You May Also Like</h2>
          <div className="mt-6">
            <ProductGrid products={relatedProducts} />
          </div>
        </div>
      )}

      {/* Browse by Categories */}
      <CategoryGrid />
    </div>
  );
}
