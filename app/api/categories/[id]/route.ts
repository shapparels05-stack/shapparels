import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const [category] = await db
    .select()
    .from(categories)
    .where(eq(categories.id, id))
    .limit(1);

  if (!category) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(category);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  // Determine level from parent
  let level = 0;
  if (body.parentId) {
    const [parent] = await db
      .select({ level: categories.level })
      .from(categories)
      .where(eq(categories.id, body.parentId))
      .limit(1);
    if (!parent) {
      return NextResponse.json({ error: "Parent category not found" }, { status: 400 });
    }
    if (parent.level >= 2) {
      return NextResponse.json({ error: "Maximum nesting depth is 3 levels" }, { status: 400 });
    }
    level = parent.level + 1;
  }

  const [updated] = await db
    .update(categories)
    .set({
      name: body.name,
      slug: body.slug,
      description: body.description || null,
      image: body.image || null,
      parentId: body.parentId || null,
      level,
      sortOrder: body.sortOrder || 0,
    })
    .where(eq(categories.id, id))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  revalidatePath("/");
  return NextResponse.json(updated);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  await db.delete(categories).where(eq(categories.id, id));

  revalidatePath("/");
  return NextResponse.json({ success: true });
}
