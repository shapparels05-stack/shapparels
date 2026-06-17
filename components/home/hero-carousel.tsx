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
  // Optional mobile overrides — null = inherit the desktop value.
  mobileTextColor: string | null;
  mobileTextPosition: string | null;
  mobileTextVAlign: string | null;
  mobileScrim: boolean | null;
  hideTextOnMobile: boolean;
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

// The positioned text block (headline / subtext / CTA). Rendered separately for
// desktop and mobile so each can have its own colour / position / scrim.
function HeroTextOverlay({
  slide,
  textColor,
  position,
  vAlign,
  scrim,
  visibility,
}: {
  slide: HeroSlide;
  textColor: string;
  position: string;
  vAlign: string;
  scrim: boolean;
  visibility: string; // display + responsive classes, e.g. "hidden sm:flex"
}) {
  const dark = textColor === "dark";
  const headlineColor = dark ? "text-neutral-900" : "text-white drop-shadow-lg";
  const subColor = dark ? "text-neutral-800" : "text-white/85 drop-shadow-md";
  const justify =
    position === "left" ? "justify-start" : position === "right" ? "justify-end" : "justify-center";
  const align =
    position === "left"
      ? "text-left items-start"
      : position === "right"
      ? "text-right items-end"
      : "text-center items-center";
  const vClass =
    vAlign === "top" ? "items-start pt-10 sm:pt-16" : vAlign === "bottom" ? "items-end pb-10 sm:pb-16" : "items-center";

  // Soft radial fade behind the text (no hard box) for legibility.
  const scrimStyle = scrim
    ? {
        background: dark
          ? "radial-gradient(ellipse at center, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0.35) 45%, transparent 72%)"
          : "radial-gradient(ellipse at center, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.28) 45%, transparent 72%)",
      }
    : undefined;

  return (
    <div
      className={`absolute inset-0 z-10 mx-auto h-full max-w-6xl px-6 sm:px-10 ${justify} ${vClass} ${visibility}`}
    >
      <div
        className={`flex max-w-lg flex-col ${align} ${scrim ? "px-10 py-10" : ""}`}
        style={scrimStyle}
      >
        {slide.headline && (
          <h2
            className={`font-serif text-4xl font-bold tracking-tight sm:text-6xl md:text-7xl ${headlineColor}`}
          >
            {renderHeadline(slide.headline)}
          </h2>
        )}
        {slide.subheadline && (
          <p className={`mt-4 text-base sm:mt-6 sm:text-lg ${subColor}`}>{slide.subheadline}</p>
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
  );
}

export function HeroCarousel({
  slides,
  heightClass = "h-[70vh]",
  forceVariant,
  unoptimized = false,
}: {
  slides: HeroSlide[];
  heightClass?: string;
  // Force a single variant (used by the admin preview's device toggle).
  forceVariant?: "mobile" | "desktop";
  // Skip the image optimizer (used in the admin preview so a freshly-uploaded
  // image shows immediately instead of briefly breaking).
  unoptimized?: boolean;
}) {
  const [index, setIndex] = useState(0);
  const count = slides.length;

  const go = useCallback((next: number) => setIndex((next + count) % count), [count]);

  // Auto-advance (skipped for a single slide).
  useEffect(() => {
    if (count <= 1) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % count), AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [count]);

  return (
    <section className={`relative overflow-hidden ${heightClass}`}>
      {slides.map((slide, i) => {
        const hasText = Boolean(slide.headline || slide.subheadline || slide.ctaLabel);
        // Mobile settings inherit desktop values when not overridden.
        const mColor = slide.mobileTextColor || slide.textColor;
        const mPos = slide.mobileTextPosition || slide.textPosition;
        const mVA = slide.mobileTextVAlign || slide.textVAlign;
        const mScrim = slide.mobileScrim ?? slide.scrim;

        // Visibility per variant (forceVariant pins one for the preview).
        const desktopImg =
          forceVariant === "mobile" ? "hidden" : forceVariant === "desktop" ? "block" : "hidden sm:block";
        const mobileImg =
          forceVariant === "desktop" ? "hidden" : forceVariant === "mobile" ? "block" : "sm:hidden";
        const desktopOverlay =
          forceVariant === "mobile" ? "hidden" : forceVariant === "desktop" ? "flex" : "hidden sm:flex";
        const mobileOverlay =
          forceVariant === "desktop" ? "hidden" : forceVariant === "mobile" ? "flex" : "flex sm:hidden";

        return (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-700 ${
              i === index ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
            aria-hidden={i !== index}
          >
            {/* Desktop image */}
            <Image
              src={slide.imageUrl}
              alt={slide.headline || ""}
              fill
              priority={i === 0}
              loading={i === 0 ? "eager" : "lazy"}
              unoptimized={unoptimized}
              className={`object-cover object-[center_20%] ${desktopImg}`}
              sizes="100vw"
            />
            {/* Mobile image (falls back to the desktop image when none is set) */}
            <Image
              src={slide.mobileImageUrl || slide.imageUrl}
              alt={slide.headline || ""}
              fill
              priority={i === 0}
              loading={i === 0 ? "eager" : "lazy"}
              unoptimized={unoptimized}
              className={`object-cover object-center ${mobileImg}`}
              sizes="100vw"
            />

            {hasText && (
              <HeroTextOverlay
                slide={slide}
                textColor={slide.textColor}
                position={slide.textPosition}
                vAlign={slide.textVAlign}
                scrim={slide.scrim}
                visibility={desktopOverlay}
              />
            )}
            {hasText && !slide.hideTextOnMobile && (
              <HeroTextOverlay
                slide={slide}
                textColor={mColor}
                position={mPos}
                vAlign={mVA}
                scrim={mScrim}
                visibility={mobileOverlay}
              />
            )}
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
            {slides.map((s, j) => (
              <button
                key={s.id}
                onClick={() => setIndex(j)}
                aria-label={`Go to slide ${j + 1}`}
                className={`h-2 rounded-full transition-all ${
                  j === index ? "w-6 bg-white" : "w-2 bg-white/50 hover:bg-white/80"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
