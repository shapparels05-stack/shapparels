import { db } from "@/lib/db";
import { categories, products, productImages } from "@/lib/db/schema";
import { eq, and, asc, desc, isNull, inArray } from "drizzle-orm";

export interface CategoryWithChildren {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  parentId: string | null;
  level: number;
  sortOrder: number;
  isActive: boolean;
  children: CategoryWithChildren[];
}

export async function getCategories() {
  return db
    .select()
    .from(categories)
    .where(eq(categories.isActive, true))
    .orderBy(asc(categories.sortOrder));
}

export async function getAllCategoriesFlat() {
  return db
    .select()
    .from(categories)
    .orderBy(asc(categories.sortOrder));
}

export async function getCategoriesHierarchy(): Promise<CategoryWithChildren[]> {
  const all = await getCategories();

  const map = new Map<string, CategoryWithChildren>();
  const roots: CategoryWithChildren[] = [];

  // First pass: create nodes
  for (const cat of all) {
    map.set(cat.id, { ...cat, children: [] });
  }

  // Second pass: build tree
  for (const cat of all) {
    const node = map.get(cat.id)!;
    if (cat.parentId && map.has(cat.parentId)) {
      map.get(cat.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

export async function getCategoryBySlug(slug: string) {
  const [category] = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, slug))
    .limit(1);
  return category || null;
}

export async function getCategoryWithAncestors(slug: string) {
  const category = await getCategoryBySlug(slug);
  if (!category) return null;

  const ancestors: typeof category[] = [];
  let current = category;

  while (current.parentId) {
    const [parent] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, current.parentId))
      .limit(1);
    if (!parent) break;
    ancestors.unshift(parent);
    current = parent;
  }

  return { category, ancestors };
}

// Top-level categories for the homepage grid, each resolved to a thumbnail:
// the category's own image if set, otherwise a representative product image
// pulled from anywhere in its subtree, otherwise null (styled placeholder).
export async function getTopLevelCategoriesWithThumbnails() {
  const cats = await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      image: categories.image,
    })
    .from(categories)
    .where(and(eq(categories.isActive, true), isNull(categories.parentId)))
    .orderBy(asc(categories.sortOrder));

  return Promise.all(
    cats.map(async (cat) => {
      if (cat.image) return cat;

      const subtreeIds = await getDescendantIds(cat.id); // includes cat.id
      const [derived] = await db
        .select({ url: productImages.url })
        .from(productImages)
        .innerJoin(products, eq(productImages.productId, products.id))
        .where(and(eq(products.isActive, true), inArray(products.categoryId, subtreeIds)))
        .orderBy(asc(productImages.sortOrder), desc(products.createdAt))
        .limit(1);

      return { ...cat, image: derived?.url ?? null };
    })
  );
}

export async function getDescendantIds(categoryId: string): Promise<string[]> {
  const ids = [categoryId];
  const children = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.parentId, categoryId));

  for (const child of children) {
    const childDescendants = await getDescendantIds(child.id);
    ids.push(...childDescendants);
  }

  return ids;
}
