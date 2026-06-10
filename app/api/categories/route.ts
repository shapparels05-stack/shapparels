import { NextRequest, NextResponse } from "next/server";
import { getCategories } from "@/lib/db/queries/categories";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export async function GET() {
  const allCategories = await getCategories();
  return NextResponse.json(allCategories);
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, slug, description, image, sortOrder, parentId } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: "Name and slug are required" }, { status: 400 });
    }

    // Determine level from parent
    let level = 0;
    if (parentId) {
      const [parent] = await db
        .select({ level: categories.level })
        .from(categories)
        .where(eq(categories.id, parentId))
        .limit(1);
      if (!parent) {
        return NextResponse.json({ error: "Parent category not found" }, { status: 400 });
      }
      if (parent.level >= 2) {
        return NextResponse.json({ error: "Maximum nesting depth is 3 levels" }, { status: 400 });
      }
      level = parent.level + 1;
    }

    const [category] = await db
      .insert(categories)
      .values({
        name,
        slug,
        description: description || null,
        image: image || null,
        parentId: parentId || null,
        level,
        sortOrder: sortOrder || 0,
      })
      .returning();

    revalidatePath("/"); // homepage category grid
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Category create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
