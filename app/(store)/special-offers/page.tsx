import type { Metadata } from "next";
import { getActiveSpecialOffers } from "@/lib/db/queries/special-offers";
import { SpecialOfferCard } from "@/components/special-offers/special-offer-card";
import { SITE_URL } from "@/lib/constants";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Special Offers",
  description:
    "Exclusive product bundles at discounted combined prices — limited-time combo deals from SH Apparels. Cash on Delivery across Pakistan.",
  alternates: { canonical: `${SITE_URL}/special-offers` },
};

export default async function SpecialOffersPage() {
  const offers = await getActiveSpecialOffers();

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
          Combo Deals
        </p>
        <h1 className="mt-2 font-serif text-3xl font-bold sm:text-4xl">Special Offers</h1>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Curated product bundles at a lower combined price — grab more, save more.
        </p>
      </div>

      {offers.length === 0 ? (
        <p className="mt-16 text-center text-muted-foreground">
          No special offers right now. Check back soon!
        </p>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
          {offers.map((offer) => (
            <SpecialOfferCard key={offer.id} offer={offer} />
          ))}
        </div>
      )}
    </div>
  );
}
