import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { PriceDisplay } from "@/components/shared/price-display";
import { OfferCountdown } from "@/components/products/offer-countdown";
import { isLimitedOfferActive } from "@/lib/pricing";
import { CURRENCY_SYMBOL } from "@/lib/constants";
import type { SpecialOfferListItem } from "@/lib/db/queries/special-offers";

export function SpecialOfferCard({ offer }: { offer: SpecialOfferListItem }) {
  const soldOut = !offer.available;
  const timerActive =
    !soldOut && isLimitedOfferActive(offer.saleEndsAt, offer.saleRepeatHours);

  return (
    <Link href={`/special-offers/${offer.slug}`} className="group block">
      <div className="relative aspect-square overflow-hidden rounded-lg border border-border/50 bg-card">
        {offer.image ? (
          <Image
            src={offer.image}
            alt={offer.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            No Image
          </div>
        )}

        {soldOut && <div className="absolute inset-0 z-10 bg-black/50" />}

        <div className="absolute top-2 left-2 z-20 flex flex-col gap-1">
          {soldOut ? (
            <Badge variant="secondary" className="bg-neutral-800 text-white text-xs">
              Out of Stock
            </Badge>
          ) : offer.savings > 0 ? (
            <Badge
              variant="destructive"
              className="hidden text-xs font-semibold sm:inline-flex"
            >
              SAVE {CURRENCY_SYMBOL} {offer.savings.toLocaleString()}
            </Badge>
          ) : null}
          {timerActive && offer.saleEndsAt && (
            <OfferCountdown
              endsAt={offer.saleEndsAt}
              repeatHours={offer.saleRepeatHours}
              variant="badge"
            />
          )}
        </div>

        <Badge
          variant="secondary"
          className="absolute top-2 right-2 z-20 bg-primary/90 text-primary-foreground text-xs font-semibold"
        >
          {offer.code}
        </Badge>
      </div>

      <div className="mt-3 space-y-1">
        <p className="text-xs uppercase tracking-wider text-primary">
          Bundle · {offer.productCount} items
        </p>
        <h3 className="font-serif text-sm font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors">
          {offer.name}
        </h3>
        <PriceDisplay
          price={parseFloat(offer.price)}
          compareAtPrice={offer.originalPrice > parseFloat(offer.price) ? offer.originalPrice : null}
        />
      </div>
    </Link>
  );
}
