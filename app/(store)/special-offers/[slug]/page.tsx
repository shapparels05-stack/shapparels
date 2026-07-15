import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getSpecialOfferBySlug } from "@/lib/db/queries/special-offers";
import { getProductsGroupedByCategory } from "@/lib/db/queries/products";
import { ProductCarousel } from "@/components/products/product-carousel";
import { ProductImages } from "@/components/products/product-images";
import { PriceDisplay } from "@/components/shared/price-display";
import { OfferCountdown } from "@/components/products/offer-countdown";
import { BundleAddToCart } from "@/components/special-offers/bundle-add-to-cart";
import { ProductTrustBadges } from "@/components/products/product-trust-badges";
import { Badge } from "@/components/ui/badge";
import { isLimitedOfferActive } from "@/lib/pricing";
import { CURRENCY_SYMBOL, SITE_URL } from "@/lib/constants";

export const revalidate = 300;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const offer = await getSpecialOfferBySlug(slug);
  if (!offer) return { title: "Offer not found" };
  return {
    title: `${offer.name} (${offer.code})`,
    description:
      offer.description ||
      `${offer.name} — a bundle of ${offer.products.length} products for ${CURRENCY_SYMBOL} ${parseFloat(offer.price).toLocaleString()}. Cash on Delivery across Pakistan.`,
    alternates: { canonical: `${SITE_URL}/special-offers/${offer.slug}` },
  };
}

export default async function SpecialOfferDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const offer = await getSpecialOfferBySlug(slug);
  if (!offer) notFound();

  // "You May Also Like" — prioritise the category of the first bundled product.
  const categoryGroups = await getProductsGroupedByCategory({
    perCategory: 12,
    prioritizeCategoryId: undefined,
    excludeProductId: offer.products[0]?.id,
  });

  const price = parseFloat(offer.price);
  const soldOut = !offer.available;
  const timerActive =
    !soldOut && isLimitedOfferActive(offer.saleEndsAt, offer.saleRepeatHours);
  const galleryImages = offer.gallery.map((url, i) => ({
    id: String(i),
    url,
    alt: offer.name,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="min-w-0">
          <ProductImages
            images={galleryImages}
            productName={offer.name}
            code={offer.code}
            soldOut={soldOut}
          />
        </div>

        <div className="min-w-0">
          <p className="text-sm font-medium uppercase tracking-wider text-primary">
            Special Offer
          </p>
          <h1 className="mt-1 font-serif text-3xl font-bold sm:text-4xl">{offer.name}</h1>

          <div className="mt-6 space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <PriceDisplay
                price={price}
                compareAtPrice={offer.originalPrice > price ? offer.originalPrice : null}
                className="text-2xl"
              />
              {!soldOut && offer.savings > 0 && (
                <Badge variant="destructive" className="text-sm">
                  Save {CURRENCY_SYMBOL} {offer.savings.toLocaleString()}
                </Badge>
              )}
              {soldOut && (
                <span className="inline-flex items-center rounded-md bg-neutral-800 px-3 py-1 text-sm font-semibold text-white">
                  Out of Stock
                </span>
              )}
            </div>

            {timerActive && offer.saleEndsAt && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                <p className="mb-2 text-sm font-semibold text-destructive">
                  ⚡ Limited-time offer ends in
                </p>
                <OfferCountdown
                  endsAt={offer.saleEndsAt}
                  repeatHours={offer.saleRepeatHours}
                  variant="full"
                />
              </div>
            )}

            {offer.description && (
              <p className="text-muted-foreground">{offer.description}</p>
            )}

            {/* Included products */}
            <div>
              <p className="text-sm font-medium text-foreground">
                This bundle includes {offer.products.length} items:
              </p>
              <div className="mt-3 space-y-2">
                {offer.products.map((p) => (
                  <Link
                    key={p.id}
                    href={`/products/${p.slug}`}
                    className="flex items-center gap-3 rounded-md border border-border/50 p-2 transition-colors hover:bg-accent"
                  >
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border border-border/50 bg-card">
                      {p.image ? (
                        <Image src={p.image} alt={p.name} fill className="object-cover" sizes="48px" />
                      ) : null}
                    </div>
                    <span className="min-w-0 flex-1 truncate text-sm">
                      {p.name}
                      {p.variantLabel && (
                        <span className="text-muted-foreground"> — {p.variantLabel}</span>
                      )}
                    </span>
                    <span className="shrink-0 text-sm text-muted-foreground line-through">
                      {CURRENCY_SYMBOL} {parseFloat(p.unitPrice).toLocaleString()}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            <BundleAddToCart
              offer={{
                id: offer.id,
                code: offer.code,
                name: offer.name,
                slug: offer.slug,
                price,
                originalPrice: offer.originalPrice,
                image: offer.gallery[0] || "",
                available: offer.available,
              }}
            />
          </div>

          <ProductTrustBadges />
        </div>
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
    </div>
  );
}
