"use client";

import { useState } from "react";
import Image from "next/image";
import { toThumbUrl } from "@/lib/images";

interface CardImageProps {
  src: string; // full image url
  alt: string;
  className?: string;
  sizes?: string;
}

// Loads the pre-generated thumbnail; if it's missing (e.g. an image not yet
// backfilled), it falls back to the full image so a card never breaks.
export function CardImage({ src, alt, className, sizes }: CardImageProps) {
  const [current, setCurrent] = useState(toThumbUrl(src));
  return (
    <Image
      src={current}
      alt={alt}
      fill
      className={className}
      sizes={sizes}
      onError={() => {
        if (current !== src) setCurrent(src);
      }}
    />
  );
}
