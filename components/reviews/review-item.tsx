import { StarRating } from "./star-rating";

export interface ReviewItemData {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  authorName: string;
  createdAt: string | Date;
}

export function ReviewItem({ review }: { review: ReviewItemData }) {
  return (
    <div className="border-b border-border/50 py-4 last:border-0">
      <div className="flex items-center justify-between gap-2">
        <StarRating value={review.rating} size={14} />
        <span className="text-xs text-muted-foreground">
          {new Date(review.createdAt).toLocaleDateString()}
        </span>
      </div>
      {review.title && (
        <h4 className="mt-2 text-sm font-semibold">{review.title}</h4>
      )}
      <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
        {review.body}
      </p>
      <p className="mt-2 text-xs font-medium text-foreground/70">— {review.authorName}</p>
    </div>
  );
}
