"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X, Trash2, Loader2, ExternalLink } from "lucide-react";
import { StarRating } from "@/components/reviews/star-rating";
import { toast } from "sonner";

interface AdminReview {
  id: string;
  productId: string;
  productName: string | null;
  productSlug: string | null;
  rating: number;
  title: string | null;
  body: string;
  authorName: string;
  authorEmail: string | null;
  status: string;
  createdAt: Date;
}

interface ReviewListProps {
  reviews: AdminReview[];
  filter: string;
  page: number;
  totalPages: number;
}

const FILTERS = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "all", label: "All" },
];

const STATUS_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  pending: { label: "Pending", variant: "default" },
  approved: { label: "Approved", variant: "secondary" },
  rejected: { label: "Rejected", variant: "destructive" },
};

export function ReviewList({ reviews, filter, page, totalPages }: ReviewListProps) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function setStatus(id: string, status: "approved" | "rejected") {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      toast.success(status === "approved" ? "Review approved" : "Review rejected");
      router.refresh();
    } catch {
      toast.error("Failed to update review");
    } finally {
      setLoadingId(null);
    }
  }

  async function handleDelete(id: string) {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/reviews/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Review deleted");
      router.refresh();
    } catch {
      toast.error("Failed to delete review");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={`/admin/reviews?filter=${f.key}`}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              filter === f.key
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {reviews.length === 0 ? (
        <p className="text-center py-8 text-muted-foreground">No reviews found.</p>
      ) : (
        <div className="space-y-2">
          {reviews.map((r) => {
            const badge = STATUS_BADGE[r.status] ?? STATUS_BADGE.pending;
            return (
              <div key={r.id} className="rounded-lg border border-border/50 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <StarRating value={r.rating} size={14} />
                      <Badge variant={badge.variant} className="text-xs">{badge.label}</Badge>
                      {r.productSlug ? (
                        <Link
                          href={`/products/${r.productSlug}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          {r.productName} <ExternalLink className="h-3 w-3" />
                        </Link>
                      ) : (
                        <span className="text-xs text-muted-foreground">{r.productName ?? "Deleted product"}</span>
                      )}
                    </div>
                    {r.title && <p className="text-sm font-semibold">{r.title}</p>}
                    <p className="text-sm text-foreground/80 whitespace-pre-wrap">{r.body}</p>
                    <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                      <span>{r.authorName}</span>
                      {r.authorEmail && <span>{r.authorEmail}</span>}
                      <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex shrink-0 gap-1">
                    {r.status !== "approved" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setStatus(r.id, "approved")}
                        disabled={loadingId === r.id}
                        title="Approve"
                        className="text-green-600 hover:text-green-600"
                      >
                        {loadingId === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      </Button>
                    )}
                    {r.status !== "rejected" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setStatus(r.id, "rejected")}
                        disabled={loadingId === r.id}
                        title="Reject"
                      >
                        {loadingId === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(r.id)}
                      disabled={loadingId === r.id}
                      title="Delete"
                      className="text-destructive hover:text-destructive"
                    >
                      {loadingId === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          {page > 1 && (
            <Link href={`/admin/reviews?filter=${filter}&page=${page - 1}`}>
              <Button variant="outline" size="sm">Previous</Button>
            </Link>
          )}
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          {page < totalPages && (
            <Link href={`/admin/reviews?filter=${filter}&page=${page + 1}`}>
              <Button variant="outline" size="sm">Next</Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
