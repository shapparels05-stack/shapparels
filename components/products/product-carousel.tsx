"use client";

import { useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard } from "./product-card";

type CarouselProduct = React.ComponentProps<typeof ProductCard>["product"];

const AUTOPLAY_MS = 3500;

export function ProductCarousel({
  products,
  autoplay = true,
}: {
  products: CarouselProduct[];
  autoplay?: boolean;
}) {
  const trackRef = useRef<HTMLDivElement>(null);

  const scrollByCard = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-card]");
    const amount = card ? card.offsetWidth + 16 : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  };

  // Auto-advance one card at a time, looping; paused while hovered.
  useEffect(() => {
    if (!autoplay || products.length <= 1) return;
    const el = trackRef.current;
    if (!el) return;
    let paused = false;
    const onEnter = () => (paused = true);
    const onLeave = () => (paused = false);
    el.addEventListener("mouseenter", onEnter);
    el.addEventListener("mouseleave", onLeave);

    const id = setInterval(() => {
      if (paused) return;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 8;
      if (atEnd) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        const card = el.querySelector<HTMLElement>("[data-card]");
        el.scrollBy({ left: card ? card.offsetWidth + 16 : el.clientWidth * 0.8, behavior: "smooth" });
      }
    }, AUTOPLAY_MS);

    return () => {
      clearInterval(id);
      el.removeEventListener("mouseenter", onEnter);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [autoplay, products.length]);

  return (
    <div className="group/carousel relative">
      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {products.map((product) => (
          <div
            key={product.id}
            data-card
            className="w-[60%] shrink-0 snap-start sm:w-[40%] md:w-[30%] lg:w-[23%]"
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>

      {products.length > 1 && (
        <>
          <button
            onClick={() => scrollByCard(-1)}
            aria-label="Previous"
            className="absolute -left-3 top-1/3 hidden -translate-y-1/2 rounded-full border border-border bg-background/90 p-2 text-muted-foreground shadow-sm transition-colors hover:text-foreground group-hover/carousel:block lg:block"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => scrollByCard(1)}
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
