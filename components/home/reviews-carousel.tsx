"use client";

import { useRef, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { StarRating } from "@/components/reviews/star-rating";

const AUTOPLAY_MS = 3500;

export interface HomeReview {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  authorName: string;
  productName: string;
  productSlug: string;
}

export function ReviewsCarousel({ reviews }: { reviews: HomeReview[] }) {
  const trackRef = useRef<HTMLDivElement>(null);

  const scrollByCard = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-card]");
    const amount = card ? card.offsetWidth + 16 : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  };

  // Auto-advance one card at a time, looping back to the start at the end.
  // Paused while the pointer is over the carousel so people can read.
  useEffect(() => {
    if (reviews.length <= 1) return;
    let paused = false;
    const el = trackRef.current;
    if (!el) return;

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
        el.scrollBy({ left: (card ? card.offsetWidth + 16 : el.clientWidth * 0.8), behavior: "smooth" });
      }
    }, AUTOPLAY_MS);

    return () => {
      clearInterval(id);
      el.removeEventListener("mouseenter", onEnter);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [reviews.length]);

  return (
    <div className="relative mt-10">
      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {reviews.map((r) => (
          <div
            key={r.id}
            data-card
            className="flex w-[85%] shrink-0 snap-start flex-col rounded-xl border border-border/60 bg-card p-6 sm:w-[46%] lg:w-[31%]"
          >
            <Quote className="h-6 w-6 text-primary/40" />
            <StarRating value={r.rating} size={16} className="mt-3" />
            {r.title && (
              <p className="mt-3 font-medium text-foreground">{r.title}</p>
            )}
            <p className="mt-2 line-clamp-4 flex-1 text-sm text-muted-foreground">
              {r.body}
            </p>
            <div className="mt-4 border-t border-border/50 pt-3">
              <p className="text-sm font-medium">{r.authorName}</p>
              <Link
                href={`/products/${r.productSlug}`}
                className="text-xs text-muted-foreground hover:text-primary"
              >
                on {r.productName}
              </Link>
            </div>
          </div>
        ))}
      </div>

      {reviews.length > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          <button
            onClick={() => scrollByCard(-1)}
            aria-label="Previous reviews"
            className="rounded-full border border-border p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => scrollByCard(1)}
            aria-label="More reviews"
            className="rounded-full border border-border p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
}
