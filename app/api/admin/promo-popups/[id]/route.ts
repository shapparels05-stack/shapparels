import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { promoPopups } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { promoPopupSchema } from "@/lib/validators/promo-popup";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const parsed = promoPopupSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Validation failed" },
      { status: 400 }
    );
  }
  const d = parsed.data;
  const [row] = await db
    .update(promoPopups)
    .set({
      title: d.title ?? null,
      imageUrl: d.imageUrl,
      linkUrl: d.linkUrl ?? null,
      frequency: d.frequency,
      isActive: d.isActive,
      sortOrder: d.sortOrder,
    })
    .where(eq(promoPopups.id, id))
    .returning();
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  revalidatePath("/");
  return NextResponse.json(row);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await db.delete(promoPopups).where(eq(promoPopups.id, id));
  revalidatePath("/");
  return NextResponse.json({ ok: true });
}
