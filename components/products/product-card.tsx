import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { PriceDisplay } from "@/components/shared/price-display";
import { StarRating } from "@/components/reviews/star-rating";
import { CardImage } from "./card-image";
import { HoverImage } from "./hover-image";
import { OfferCountdown } from "./offer-countdown";
import { bucketDiscountPercent, activeCompareAtPrice, isLimitedOfferActive } from "@/lib/pricing";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    code?: string | null;
    slug: string;
    basePrice: string;
    compareAtPrice: string | null;
    saleEndsAt?: Date | string | null;
    stock: number;
    isFeatured: boolean;
    categoryName?: string | null;
    images: { url: string; alt: string | null }[];
    ratingAverage?: number;
    ratingCount?: number;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const price = parseFloat(product.basePrice);
  const rawCompareAt = product.compareAtPrice ? parseFloat(product.compareAtPrice) : null;
  // Drop the discount if its limited-time offer has already expired.
  const compareAt = activeCompareAtPrice(rawCompareAt);
  const discountPercent = bucketDiscountPercent(price, compareAt);
  const hasDiscount = discountPercent > 0;
  const limitedOffer = hasDiscount && isLimitedOfferActive(product.saleEndsAt);
  const isSoldOut = product.stock <= 0;
  const displayName = product.code ? `${product.code} - ${product.name}` : product.name;
  const primaryImage = product.images[0];
  const secondImage = product.images[1];

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="relative aspect-square overflow-hidden rounded-lg border border-border/50 bg-card">
        {primaryImage ? (
          <>
            <CardImage
              src={primaryImage.url}
              alt={primaryImage.alt || product.name}
              className="object-cover transition-opacity duration-500 group-hover:opacity-0"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
            {secondImage && (
              <HoverImage src={secondImage.url} alt={secondImage.alt || product.name} />
            )}
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            No Image
          </div>
        )}

        {/* Sold out overlay */}
        {isSoldOut && (
          <div className="absolute inset-0 z-10 bg-black/50" />
        )}

        {/* Badges — promoted to their own GPU layer so they don't leave
            ghost trails when scrolling in weak in-app browsers (FB/Instagram). */}
        <div className="absolute top-2 left-2 z-20 flex flex-col gap-1 [transform:translateZ(0)] [backface-visibility:hidden] [will-change:transform]">
          {isSoldOut && (
            <Badge variant="secondary" className="bg-neutral-800 text-white text-xs">
              Sold Out
            </Badge>
          )}
          {!isSoldOut && hasDiscount && (
            <Badge variant="destructive" className="text-xs font-semibold">
              UP TO {discountPercent}% OFF
            </Badge>
          )}
          {!isSoldOut && limitedOffer && product.saleEndsAt && (
            <OfferCountdown endsAt={product.saleEndsAt} variant="badge" />
          )}
          {!isSoldOut && product.isFeatured && (
            <Badge className="bg-primary text-primary-foreground text-xs">
              New
            </Badge>
          )}
        </div>
      </div>

      <div className="mt-3 space-y-1">
        {product.categoryName && (
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            {product.categoryName}
          </p>
        )}
        <h3 className="font-serif text-sm font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors">
          {displayName}
        </h3>
        <PriceDisplay price={price} compareAtPrice={compareAt} />
        {product.ratingCount ? (
          <div className="flex items-center gap-1.5">
            <StarRating value={product.ratingAverage ?? 0} size={12} />
            <span className="text-xs text-muted-foreground">({product.ratingCount})</span>
          </div>
        ) : null}
      </div>
    </Link>
  );
}
