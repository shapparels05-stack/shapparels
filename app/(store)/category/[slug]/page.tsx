import { redirect, notFound } from "next/navigation";
import { getCategoryBySlug } from "@/lib/db/queries/categories";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

// Category browsing is consolidated into /products?category=<id>, which has the
// full filter sidebar, sort and pagination. Old /category/<slug> links (nav,
// footer, breadcrumbs, search engines) redirect here so nothing breaks.
export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();
  redirect(`/products?category=${category.id}`);
}
