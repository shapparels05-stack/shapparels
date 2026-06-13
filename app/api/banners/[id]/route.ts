import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { banners } from "@/lib/db/schema";
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
      .update(banners)
      .set({
        imageUrl: body.imageUrl,
        mobileImageUrl: body.mobileImageUrl || null,
        textColor: body.textColor === "dark" ? "dark" : "light",
        textPosition: ["left", "center", "right"].includes(body.textPosition)
          ? body.textPosition
          : "center",
        textVAlign: ["top", "center", "bottom"].includes(body.textVAlign)
          ? body.textVAlign
          : "center",
        scrim: Boolean(body.scrim),
        headline: body.headline || null,
        subheadline: body.subheadline || null,
        ctaLabel: body.ctaLabel || null,
        ctaHref: body.ctaHref || null,
        sortOrder: Number(body.sortOrder) || 0,
        isActive: body.isActive ?? true,
      })
      .where(eq(banners.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Banner not found" }, { status: 404 });
    }
    revalidatePath("/");
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Banner update error:", error);
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
  await db.delete(banners).where(eq(banners.id, id));
  revalidatePath("/");
  return NextResponse.json({ ok: true });
}
