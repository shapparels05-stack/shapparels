import { SITE_NAME } from "@/lib/constants";

interface ProductJsonLdProps {
  product: {
    name: string;
    description: string | null;
    basePrice: string;
    images: { url: string }[];
    slug: string;
    code?: string | null;
    stock?: number;
  };
  siteUrl: string;
  rating?: { average: number; count: number };
}

export function ProductJsonLd({ product, siteUrl, rating }: ProductJsonLdProps) {
  const inStock = product.stock === undefined || product.stock > 0;

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || "",
    image: product.images.map((i) => i.url),
    url: `${siteUrl}/products/${product.slug}`,
    brand: { "@type": "Brand", name: SITE_NAME },
    ...(product.code ? { sku: product.code, mpn: product.code } : {}),
    offers: {
      "@type": "Offer",
      price: product.basePrice,
      priceCurrency: "PKR",
      // Real availability based on stock (was hard-coded "InStock" before).
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: `${siteUrl}/products/${product.slug}`,
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: SITE_NAME },
    },
  };

  // Only emit aggregateRating when real reviews exist — Google rejects
  // (and may flag) ratings with a reviewCount of 0.
  if (rating && rating.count > 0) {
    jsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: rating.average.toFixed(1),
      reviewCount: rating.count,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
