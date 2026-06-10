import { getActiveBanners } from "@/lib/db/queries/banners";
import { HeroCarousel } from "./hero-carousel";
import { HeroBanner } from "./hero-banner";

// Renders the admin-managed carousel when slides exist; otherwise falls back
// to the static hero so the homepage is never empty.
export async function HomeHero() {
  const banners = await getActiveBanners();

  if (banners.length === 0) {
    return <HeroBanner />;
  }

  return (
    <HeroCarousel
      slides={banners.map((b) => ({
        id: b.id,
        imageUrl: b.imageUrl,
        headline: b.headline,
        subheadline: b.subheadline,
        ctaLabel: b.ctaLabel,
        ctaHref: b.ctaHref,
      }))}
    />
  );
}
