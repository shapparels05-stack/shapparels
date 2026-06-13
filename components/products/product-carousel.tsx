"use client";

import { useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard } from "./product-card";

type CarouselProduct = React.ComponentProps<typeof ProductCard>["product"];

const AUTOPLAY_MS = 3000;

export function ProductCarousel({
  products,
  autoplay = true,
}: {
  products: CarouselProduct[];
  autoplay?: boolean;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const loop = products.length > 1;
  // Two identical copies → wrapping at the seam is invisible (infinite scroll).
  const items = loop ? [...products, ...products] : products;

  const cardAmount = () => {
    const el = trackRef.current;
    if (!el) return 0;
    const card = el.querySelector<HTMLElement>("[data-card]");
    return card ? card.offsetWidth + 16 : el.clientWidth * 0.8;
  };

  // Keep the scroll position within the first copy; jumping by exactly one
  // copy's width is seamless because both copies are identical.
  const wrap = () => {
    const el = trackRef.current;
    if (!el || !loop) return;
    const half = el.scrollWidth / 2;
    if (el.scrollLeft >= half) el.scrollLeft -= half;
  };

  const step = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    // To scroll left past the start, first hop into the duplicate copy.
    if (dir === -1 && loop && el.scrollLeft <= 5) {
      el.scrollLeft += el.scrollWidth / 2;
    }
    el.scrollBy({ left: dir * cardAmount(), behavior: "smooth" });
  };

  // Wrap on any scroll (manual drag, momentum, or autoplay).
  useEffect(() => {
    const el = trackRef.current;
    if (!el || !loop) return;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        wrap();
        ticking = false;
      });
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [loop]);

  // Auto-advance forever; paused while hovered.
  useEffect(() => {
    if (!autoplay || !loop) return;
    const el = trackRef.current;
    if (!el) return;
    let paused = false;
    const onEnter = () => (paused = true);
    const onLeave = () => (paused = false);
    el.addEventListener("mouseenter", onEnter);
    el.addEventListener("mouseleave", onLeave);
    const id = setInterval(() => {
      if (!paused) step(1);
    }, AUTOPLAY_MS);
    return () => {
      clearInterval(id);
      el.removeEventListener("mouseenter", onEnter);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [autoplay, loop]);

  return (
    <div className="group/carousel relative">
      <div
        ref={trackRef}
        className="flex gap-4 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((product, i) => (
          <div
            key={`${product.id}-${i}`}
            data-card
            className="w-[60%] shrink-0 sm:w-[40%] md:w-[30%] lg:w-[23%]"
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>

      {loop && (
        <>
          <button
            onClick={() => step(-1)}
            aria-label="Previous"
            className="absolute -left-3 top-1/3 hidden -translate-y-1/2 rounded-full border border-border bg-background/90 p-2 text-muted-foreground shadow-sm transition-colors hover:text-foreground group-hover/carousel:block lg:block"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => step(1)}
            aria-label="Next"
            className="absolute -right-3 top-1/3 hidden -translate-y-1/2 rounded-full border border-border bg-background/90 p-2 text-muted-foreground shadow-sm transition-colors hover:text-foreground group-hover/carousel:block lg:block"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}
    </div>
  );
}
