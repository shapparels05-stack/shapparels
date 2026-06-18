"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { toThumbUrl } from "@/lib/images";

// The product card's second image only matters for the desktop hover swap.
// Render it ONLY on devices that support hover, so phones don't download or
// decode a second image per card. Uses the lightweight thumbnail.
export function HoverImage({ src, alt }: { src: string; alt: string }) {
  const [enabled, setEnabled] = useState(false);
  const [current, setCurrent] = useState(() => toThumbUrl(src));

  useEffect(() => {
    // Client-only hover capability check (kept in an effect to avoid a
    // hydration mismatch).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (window.matchMedia?.("(hover: hover)").matches) setEnabled(true);
  }, []);

  if (!enabled) return null;

  return (
    <Image
      src={current}
      alt={alt}
      fill
      loading="lazy"
      onError={() => {
        if (current !== src) setCurrent(src);
      }}
      className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
    />
  );
}
