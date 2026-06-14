import { getSiteSettings } from "@/lib/db/queries/settings";
import { SITE_NAME, SITE_URL, SITE_DESCRIPTION, WHATSAPP_NUMBER } from "@/lib/constants";

// Site-wide Organization / OnlineStore structured data — tells Google who the
// business is, that it serves Lahore/Pakistan, accepts COD, and its socials.
export async function SiteJsonLd() {
  let settings: Record<string, string> = {};
  try {
    settings = await getSiteSettings();
  } catch {
    /* ignore */
  }
  const sameAs = [settings.facebook_url, settings.instagram_url].filter(Boolean);

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/hero-image.webp`,
    image: `${SITE_URL}/hero-image.webp`,
    description: SITE_DESCRIPTION,
    areaServed: [
      { "@type": "City", name: "Lahore" },
      { "@type": "Country", name: "Pakistan" },
    ],
    paymentAccepted: "Cash on Delivery",
    currenciesAccepted: "PKR",
    ...(WHATSAPP_NUMBER ? { telephone: `+${WHATSAPP_NUMBER}` } : {}),
    ...(sameAs.length ? { sameAs } : {}),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
