"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

// The product card's second image only matters for the desktop hover swap.
// Render it ONLY on devices that support hover, so phones don't download or
// decode a second image per card (halves grid image memory on mobile).
export function HoverImage({ src, alt }: { src: string; alt: string }) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (window.matchMedia?.("(hover: hover)").matches) setEnabled(true);
  }, []);

  if (!enabled) return null;

  return (
    <Image
      src={src}
      alt={alt}
      fill
      loading="lazy"
      className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
    />
  );
}
