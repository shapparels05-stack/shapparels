"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface HeroSlide {
  id: string;
  imageUrl: string;
  headline: string | null;
  subheadline: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
}

const AUTOPLAY_MS = 6000;

export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
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
    <section className="relative h-screen overflow-hidden">
      {slides.map((slide, i) => {
        const content = (
          <>
            <Image
              src={slide.imageUrl}
              alt={slide.headline || ""}
              fill
              // Only the first slide loads eagerly so it doesn't hurt LCP;
              // the rest lazy-load as the carousel advances.
              priority={i === 0}
              loading={i === 0 ? "eager" : "lazy"}
              className="object-cover object-[center_20%]"
              sizes="100vw"
            />
            {(slide.headline || slide.subheadline || slide.ctaLabel) && (
              <div className="relative z-10 mx-auto flex h-full max-w-4xl flex-col items-center justify-center px-4 text-center">
                {slide.headline && (
                  <h2 className="font-serif text-5xl font-bold tracking-tight text-white drop-shadow-lg sm:text-6xl md:text-7xl">
                    {slide.headline}
                  </h2>
                )}
                {slide.subheadline && (
                  <p className="mx-auto mt-6 max-w-2xl text-lg text-white/80 drop-shadow-md">
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
