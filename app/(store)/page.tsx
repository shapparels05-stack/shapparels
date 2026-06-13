import { HomeHero } from "@/components/home/home-hero";
import { LimitedTimeDeals } from "@/components/home/limited-time-deals";
import { FeaturedProducts } from "@/components/home/featured-products";
import { BrowseByCategory } from "@/components/home/browse-by-category";
import { NewArrivals } from "@/components/home/new-arrivals";
import { BestSellers } from "@/components/home/best-sellers";
import { HomeReviews } from "@/components/home/home-reviews";
import { ProductTrustBadges } from "@/components/products/product-trust-badges";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

function ProductsSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <Skeleton className="mx-auto h-4 w-32" />
        <Skeleton className="mx-auto mt-3 h-8 w-64" />
      </div>
      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="aspect-square w-full rounded-lg" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      <HomeHero />
      <Suspense fallback={<ProductsSkeleton />}>
        <LimitedTimeDeals />
      </Suspense>
      <Suspense fallback={<ProductsSkeleton />}>
        <FeaturedProducts />
      </Suspense>
      {/* Browse by Category → Best Sellers → New Arrivals (last) */}
      <Suspense fallback={<ProductsSkeleton />}>
        <BrowseByCategory />
      </Suspense>
      <Suspense fallback={<ProductsSkeleton />}>
        <BestSellers />
      </Suspense>
      <Suspense fallback={<ProductsSkeleton />}>
        <NewArrivals />
      </Suspense>
      <Suspense fallback={null}>
        <HomeReviews />
      </Suspense>
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <ProductTrustBadges />
      </section>
    </>
  );
}
