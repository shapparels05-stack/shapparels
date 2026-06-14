import Link from "next/link";
import Image from "next/image";
import { getTopLevelCategoriesWithThumbnails } from "@/lib/db/queries/categories";

export async function CategoryGrid() {
  const allCategories = await getTopLevelCategoriesWithThumbnails();

  if (allCategories.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
          Browse by
        </p>
        <h2 className="mt-2 font-serif text-3xl font-bold sm:text-4xl">
          Categories
        </h2>
      </div>
      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {allCategories.map((category) => (
          <Link
            key={category.id}
            href={`/category/${category.slug}`}
            className="group relative aspect-square overflow-hidden rounded-lg border border-border/50"
          >
            {category.image ? (
              <Image
                src={category.image}
                alt={category.name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-secondary via-card to-background">
                <span className="font-serif text-4xl font-bold text-primary/40 transition-transform duration-500 group-hover:scale-110">
                  {category.name.charAt(0)}
                </span>
              </div>
            )}
            <div className="absolute inset-0 flex items-end p-4">
              <h3 className="font-serif text-sm font-semibold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] transition-colors group-hover:text-primary">
                {category.name}
              </h3>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
