import { getReviews } from "@/lib/db/queries/reviews";
import { ReviewList } from "@/components/admin/review-list";

interface ReviewsPageProps {
  searchParams: Promise<{ filter?: string; page?: string }>;
}

export default async function AdminReviewsPage({ searchParams }: ReviewsPageProps) {
  const params = await searchParams;
  const filter = params.filter || "pending";

  const { reviews, total, page, totalPages } = await getReviews({
    status: filter,
    page: params.page ? Number(params.page) : 1,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold">Reviews</h1>
        <p className="text-muted-foreground">{total} {filter === "all" ? "total" : filter} reviews</p>
      </div>

      <ReviewList
        reviews={reviews}
        filter={filter}
        page={page}
        totalPages={totalPages}
      />
    </div>
  );
}
