"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface HeroSlide {
  id: string;
  imageUrl: string;
  mobileImageUrl: string | null;
  textColor: string; // "light" | "dark"
  textPosition: string; // "left" | "center" | "right"
  textVAlign: string; // "top" | "center" | "bottom"
  scrim: boolean;
  headline: string | null;
  subheadline: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
}

const AUTOPLAY_MS = 6000;

// Render a headline where any text wrapped in *asterisks* shows in the gold
// accent colour. e.g. "Elegance *Redefined*" → "Elegance " + gold "Redefined".
function renderHeadline(text: string) {
  return text.split(/(\*[^*]+\*)/g).map((part, i) =>
    part.length > 2 && part.startsWith("*") && part.endsWith("*") ? (
      <span key={i} className="text-primary">
        {part.slice(1, -1)}
      </span>
    ) : (
      part
    )
  );
}

export function HeroCarousel({
  slides,
  heightClass = "h-[70vh]",
}: {
  slides: HeroSlide[];
  heightClass?: string;
}) {
  const [index, setIndex] = useState(0);
  const count = slides.length;

  const go = useCallback(
    (next: number) => setIndex((next + count) % count),
    [count]
  );

  // Auto-advance (skipped for a single slide).
  useEffect(() => {
    if (count <= 1) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % count), AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [count]);

  return (
    <section className={`relative overflow-hidden ${heightClass}`}>
      {slides.map((slide, i) => {
        // Near-black for light images, white for dark images (per slide).
        const dark = slide.textColor === "dark";
        const headlineColor = dark ? "text-neutral-900" : "text-white drop-shadow-lg";
        const subColor = dark ? "text-neutral-800" : "text-white/85 drop-shadow-md";
        // Where the text block sits within the hero.
        const pos = slide.textPosition;
        const justify =
          pos === "left" ? "justify-start" : pos === "right" ? "justify-end" : "justify-center";
        const align =
          pos === "left" ? "text-left items-start" : pos === "right" ? "text-right items-end" : "text-center items-center";
        const vAlign =
          slide.textVAlign === "top"
            ? "items-start pt-12 sm:pt-16"
            : slide.textVAlign === "bottom"
            ? "items-end pb-12 sm:pb-16"
            : "items-center";
        // Optional legibility scrim behind the text — dark panel under light
        // text, light panel under dark text.
        const scrimClass = slide.scrim
          ? `rounded-2xl p-6 backdrop-blur-sm ${dark ? "bg-white/40" : "bg-black/35"}`
          : "";
        const content = (
          <>
            {/* Desktop image */}
            <Image
              src={slide.imageUrl}
              alt={slide.headline || ""}
              fill
              // Only the first slide loads eagerly so it doesn't hurt LCP;
              // the rest lazy-load as the carousel advances.
              priority={i === 0}
              loading={i === 0 ? "eager" : "lazy"}
              className="hidden object-cover object-[center_20%] sm:block"
              sizes="100vw"
            />
            {/* Mobile image — separate portrait crop so phones don't cut it.
                Falls back to the desktop image when none is set. */}
            <Image
              src={slide.mobileImageUrl || slide.imageUrl}
              alt={slide.headline || ""}
              fill
              priority={i === 0}
              loading={i === 0 ? "eager" : "lazy"}
              className="object-cover object-center sm:hidden"
              sizes="100vw"
            />
            {(slide.headline || slide.subheadline || slide.ctaLabel) && (
              <div
                className={`relative z-10 mx-auto flex h-full max-w-6xl px-6 sm:px-10 ${justify} ${vAlign}`}
              >
                <div className={`flex max-w-lg flex-col ${align} ${scrimClass}`}>
                  {slide.headline && (
                    <h2
                      className={`font-serif text-4xl font-bold tracking-tight sm:text-6xl md:text-7xl ${headlineColor}`}
                    >
                      {renderHeadline(slide.headline)}
                    </h2>
                  )}
                  {slide.subheadline && (
                    <p className={`mt-4 text-base sm:mt-6 sm:text-lg ${subColor}`}>
                      {slide.subheadline}
                    </p>
                  )}
                  {slide.ctaLabel && slide.ctaHref && (
                    <div className="mt-8">
                      <Button size="lg" asChild className="min-w-[160px]">
                        <Link href={slide.ctaHref}>{slide.ctaLabel}</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        );

        return (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-700 ${
              i === index ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
            aria-hidden={i !== index}
          >
            {content}
          </div>
        );
      })}

      {count > 1 && (
        <>
          <button
            onClick={() => go(index - 1)}
            aria-label="Previous slide"
            className="absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white backdrop-blur transition-colors hover:bg-black/50"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={() => go(index + 1)}
            aria-label="Next slide"
            className="absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white backdrop-blur transition-colors hover:bg-black/50"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-2">
            {slides.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setIndex(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-2 rounded-full transition-all ${
                  i === index ? "w-6 bg-white" : "w-2 bg-white/50 hover:bg-white/80"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
