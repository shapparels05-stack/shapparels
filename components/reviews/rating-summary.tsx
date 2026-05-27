import { StarRating } from "./star-rating";

interface RatingSummaryProps {
  average: number;
  count: number;
  size?: number;
  className?: string;
}

// Compact "★★★★☆ 4.3 (12)" summary used near the product title.
export function RatingSummary({ average, count, size = 16, className }: RatingSummaryProps) {
  if (count === 0) {
    return (
      <div className={className}>
        <StarRating value={0} size={size} />
        <span className="ml-2 text-sm text-muted-foreground">No reviews yet</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      <StarRating value={average} size={size} />
      <span className="text-sm font-medium">{average.toFixed(1)}</span>
      <span className="text-sm text-muted-foreground">
        ({count} {count === 1 ? "review" : "reviews"})
      </span>
    </div>
  );
}
