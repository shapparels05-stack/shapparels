import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { announcements } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const [updated] = await db
      .update(announcements)
      .set({
        text: body.text,
        icon: body.icon || null,
        href: body.href || null,
        sortOrder: Number(body.sortOrder) || 0,
        isActive: body.isActive ?? true,
      })
      .where(eq(announcements.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Announcement not found" }, { status: 404 });
    }
    revalidatePath("/", "layout");
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Announcement update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await db.delete(announcements).where(eq(announcements.id, id));
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}
