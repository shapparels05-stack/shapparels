import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function HeroBanner() {
  return (
    <section className="relative flex h-[80vh] items-center justify-center overflow-hidden">
      {/* Background image */}
      <Image
        src="/hero-image.webp"
        alt=""
        fill
        priority
        className="object-cover object-[center_20%]"
        sizes="100vw"
      />

      <div className="relative z-10 mx-auto max-w-4xl px-4 text-center">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-primary">
          Premium Collection
        </p>
        <h1 className="mt-4 font-serif text-5xl font-bold tracking-tight text-white drop-shadow-lg sm:text-6xl md:text-7xl lg:text-8xl">
          Elegance{" "}
          <span className="text-primary">Redefined</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-white/80 drop-shadow-md">
          Discover our curated collection of premium ladies beauty products.
          From exquisite jewelry to designer bags, find your perfect style.
        </p>
        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Button size="lg" asChild className="min-w-[160px]">
            <Link href="/products">Shop Now</Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="min-w-[160px] border-white/50 bg-transparent text-white hover:bg-white/10 hover:text-white">
            <Link href="/about">Our Story</Link>
          </Button>
        </div>
        <p className="mt-6 text-xs text-white/60">
          Free shipping on orders above Rs. 5,000 &bull; Cash on Delivery
        </p>
      </div>
    </section>
  );
}
