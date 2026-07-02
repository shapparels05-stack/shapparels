import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { promoPopups } from "@/lib/db/schema";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { promoPopupSchema } from "@/lib/validators/promo-popup";
import { getAllPromoPopups } from "@/lib/db/queries/promo-popups";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await getAllPromoPopups());
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = promoPopupSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Validation failed" },
      { status: 400 }
    );
  }
  const d = parsed.data;
  const [row] = await db
    .insert(promoPopups)
    .values({
      title: d.title ?? null,
      imageUrl: d.imageUrl,
      linkUrl: d.linkUrl ?? null,
      frequency: d.frequency,
      isActive: d.isActive,
      sortOrder: d.sortOrder,
    })
    .returning();
  revalidatePath("/");
  return NextResponse.json({ id: row.id }, { status: 201 });
}
