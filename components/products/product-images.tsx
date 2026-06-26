"use client";

import { useState } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";

interface ProductImagesProps {
  images: { id: string; url: string; alt: string | null }[];
  productName: string;
  discountPercent?: number;
  code?: string | null;
  soldOut?: boolean;
}

export function ProductImages({ images, productName, discountPercent, code, soldOut }: ProductImagesProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="aspect-square rounded-lg border border-border/50 bg-card flex items-center justify-center text-muted-foreground">
        No Image Available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative aspect-square overflow-hidden rounded-lg border border-border/50 bg-card">
        <Image
          src={images[selectedIndex].url}
          alt={images[selectedIndex].alt || productName}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />
        {soldOut ? (
          <Badge
            variant="secondary"
            className="absolute left-3 top-3 z-10 bg-neutral-800 px-3 py-1 text-base font-bold text-white sm:text-lg"
          >
            Out of Stock
          </Badge>
        ) : discountPercent && discountPercent > 0 ? (
          <Badge
            variant="destructive"
            className="absolute left-3 top-3 z-10 px-3 py-1 text-base font-bold sm:text-lg"
          >
            UP TO {discountPercent}% OFF
          </Badge>
        ) : null}
        {code ? (
          <Badge
            variant="secondary"
            className="absolute right-3 top-3 z-10 px-3 py-1 text-base font-bold sm:text-lg"
          >
            {code}
          </Badge>
        ) : null}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setSelectedIndex(index)}
              className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-md border-2 transition-colors ${
                index === selectedIndex
                  ? "border-primary"
                  : "border-border/50 hover:border-primary/50"
              }`}
            >
              <Image
                src={image.url}
                alt={image.alt || productName}
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
