interface ProductJsonLdProps {
  product: {
    name: string;
    description: string | null;
    basePrice: string;
    images: { url: string }[];
    slug: string;
  };
  siteUrl: string;
  rating?: { average: number; count: number };
}

export function ProductJsonLd({ product, siteUrl, rating }: ProductJsonLdProps) {
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || "",
    image: product.images.map((i) => i.url),
    url: `${siteUrl}/products/${product.slug}`,
    offers: {
      "@type": "Offer",
      price: product.basePrice,
      priceCurrency: "PKR",
      availability: "https://schema.org/InStock",
      seller: {
        "@type": "Organization",
        name: "SH Apparels",
      },
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
