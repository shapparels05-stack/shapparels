"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { RatingSummary } from "./rating-summary";
import { ReviewItem, type ReviewItemData } from "./review-item";
import { ReviewForm } from "./review-form";

interface ProductReviewsProps {
  productId: string;
  initialAverage: number;
  initialCount: number;
}

const PAGE_SIZE = 10;

export function ProductReviews({
  productId,
  initialAverage,
  initialCount,
}: ProductReviewsProps) {
  const [reviews, setReviews] = useState<ReviewItemData[]>([]);
  const [total, setTotal] = useState(initialCount);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const loadPage = useCallback(
    async (nextPage: number) => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/reviews?productId=${productId}&page=${nextPage}&limit=${PAGE_SIZE}`
        );
        const data = await res.json();
        setReviews((prev) =>
          nextPage === 1 ? data.reviews : [...prev, ...data.reviews]
        );
        setTotal(data.total);
        setPage(nextPage);
      } catch {
        // leave the existing list in place on failure
      } finally {
        setLoading(false);
      }
    },
    [productId]
  );

  useEffect(() => {
    loadPage(1);
  }, [loadPage]);

  const hasMore = reviews.length < total;

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-xl font-semibold">Customer Reviews</h3>
          <RatingSummary average={initialAverage} count={initialCount} />
        </div>

        {loading && reviews.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">Loading reviews...</p>
        ) : reviews.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">
            No reviews yet. Be the first to review this product!
          </p>
        ) : (
          <div className="divide-y divide-border/50">
            {reviews.map((r) => (
              <ReviewItem key={r.id} review={r} />
            ))}
          </div>
        )}

        {hasMore && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadPage(page + 1)}
            disabled={loading}
          >
            {loading ? "Loading..." : "Load more reviews"}
          </Button>
        )}
      </div>

      <div className="border-t border-border/50 pt-8">
        <ReviewForm productId={productId} />
      </div>
    </div>
  );
}
