import { getFeaturedReviews } from "@/lib/db/queries/reviews";
import { ReviewsCarousel } from "./reviews-carousel";

export async function HomeReviews() {
  const reviews = await getFeaturedReviews(8);
  if (reviews.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
          Loved by Customers
        </p>
        <h2 className="mt-2 font-serif text-3xl font-bold sm:text-4xl">
          What Our Customers Say
        </h2>
      </div>
      <ReviewsCarousel
        reviews={reviews.map((r) => ({
          id: r.id,
          rating: r.rating,
          title: r.title,
          body: r.body,
          authorName: r.authorName,
          productName: r.productName,
          productSlug: r.productSlug,
        }))}
      />
    </section>
  );
}
