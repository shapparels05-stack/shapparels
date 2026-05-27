"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number;
  size?: number;
  className?: string;
}

// Read-only star display with fractional fill (e.g. 4.3 → 4.3 stars).
export function StarRating({ value, size = 16, className }: StarRatingProps) {
  const pct = Math.max(0, Math.min(100, (value / 5) * 100));
  return (
    <div
      className={cn("relative inline-flex", className)}
      style={{ width: size * 5, height: size }}
      aria-label={`${value.toFixed(1)} out of 5 stars`}
    >
      {/* Empty layer */}
      <div className="absolute inset-0 flex">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className="text-muted-foreground/40" style={{ width: size, height: size }} />
        ))}
      </div>
      {/* Filled layer, clipped to the percentage */}
      <div className="absolute inset-0 flex overflow-hidden" style={{ width: `${pct}%` }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className="shrink-0 fill-primary text-primary"
            style={{ width: size, height: size }}
          />
        ))}
      </div>
    </div>
  );
}

interface StarRatingInputProps {
  value: number;
  onChange: (value: number) => void;
  size?: number;
}

// Interactive star picker for the review form.
export function StarRatingInput({ value, onChange, size = 28 }: StarRatingInputProps) {
  const [hover, setHover] = useState(0);
  const active = hover || value;

  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={cn(
              "transition-colors",
              star <= active ? "fill-primary text-primary" : "text-muted-foreground/40"
            )}
            style={{ width: size, height: size }}
          />
        </button>
      ))}
    </div>
  );
}
