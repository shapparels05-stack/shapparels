import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getProductBySlug, getProductsGroupedByCategory } from "@/lib/db/queries/products";
import { getProductRatingSummary } from "@/lib/db/queries/reviews";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { RatingSummary } from "@/components/reviews/rating-summary";
import { ProductReviews } from "@/components/reviews/product-reviews";
import { bucketDiscountPercent, activeCompareAtPrice } from "@/lib/pricing";
import { ProductCarousel } from "@/components/products/product-carousel";
import { getSpecialOffersForProduct } from "@/lib/db/queries/special-offers";
import { SpecialOfferCard } from "@/components/special-offers/special-offer-card";
import { ProductDetailClient } from "./product-detail-client";
import { ProductJsonLd } from "@/components/shared/product-jsonld";
import { BreadcrumbJsonLd } from "@/components/shared/breadcrumb-jsonld";
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
    alternates: { canonical: `${SITE_URL}/products/${slug}` },
    openGraph: {
      title: product.metaTitle || displayName,
      description: product.metaDescription || product.shortDescription || "",
      url: `${SITE_URL}/products/${slug}`,
      images: product.images[0] ? [{ url: product.images[0].url }] : [],
    },
  };
}

export const revalidate = 3600;

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  const [categoryGroups, ratingSummary, bundles] = await Promise.all([
    getProductsGroupedByCategory({
      perCategory: 12,
      excludeProductId: product.id,
      prioritizeCategoryId: product.categoryId ?? undefined,
    }),
    getProductRatingSummary(product.id),
    getSpecialOffersForProduct(product.id),
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
  const compareAt = activeCompareAtPrice(rawCompareAt);
  // Real availability: sum of variant stock when the product has variants.
  const effectiveStock = product.variants?.length
    ? product.variants.reduce((s: number, v: { stock: number }) => s + (v.stock || 0), 0)
    : product.stock;
  const discountPercent =
    effectiveStock > 0 ? bucketDiscountPercent(basePrice, compareAt) : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <ProductJsonLd product={product} siteUrl={SITE_URL} rating={ratingSummary} />
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <Breadcrumbs items={breadcrumbItems} />

      {/* Gallery (left) + info (right); the client component owns the layout so
          selecting a colour can filter the gallery. */}
      <div className="mt-8">
        <ProductDetailClient
          product={{
            id: product.id,
            name: product.name,
            slug: product.slug,
            basePrice: product.basePrice,
            compareAtPrice: product.compareAtPrice,
            saleEndsAt: product.saleEndsAt,
            saleRepeatHours: product.saleRepeatHours,
            isResizeable: product.isResizeable,
            stock: product.stock,
            image: product.images[0]?.url || "",
          }}
          optionTypes={product.optionTypes}
          variants={product.variants}
          images={product.images}
          discountPercent={discountPercent}
          code={product.code}
          infoHeader={
            <>
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
                <p className="mt-3 text-muted-foreground">{product.shortDescription}</p>
              )}
            </>
          }
        />
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

      {/* You May Also Like — a few items per category */}
      {categoryGroups.length > 0 && (
        <div className="mt-16">
          <h2 className="font-serif text-2xl font-bold">You May Also Like</h2>
          <div className="mt-6 space-y-10">
            {categoryGroups.map((group) => (
              <div key={group.category.id}>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-serif text-lg font-semibold">{group.category.name}</h3>
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
        </div>
      )}

      {/* Available in a bundle — cross-sell the special offers this product is in */}
      {bundles.length > 0 && (
        <div className="mt-16">
          <h2 className="font-serif text-2xl font-bold">Grab It in a Bundle &amp; Save</h2>
          <p className="mt-1 text-muted-foreground">
            This item is part of a special offer — get more for less.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
            {bundles.map((offer) => (
              <SpecialOfferCard key={offer.id} offer={offer} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
