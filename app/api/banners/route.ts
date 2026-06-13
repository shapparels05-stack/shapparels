import { NextRequest, NextResponse } from "next/server";
import { getAllBanners } from "@/lib/db/queries/banners";
import { db } from "@/lib/db";
import { banners } from "@/lib/db/schema";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export async function GET() {
  const all = await getAllBanners();
  return NextResponse.json(all);
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    if (!body.imageUrl) {
      return NextResponse.json({ error: "Image is required" }, { status: 400 });
    }

    const [banner] = await db
      .insert(banners)
      .values({
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
        mobileTextColor: body.mobileTextColor || null,
        mobileTextPosition: body.mobileTextPosition || null,
        mobileTextVAlign: body.mobileTextVAlign || null,
        mobileScrim: typeof body.mobileScrim === "boolean" ? body.mobileScrim : null,
        hideTextOnMobile: Boolean(body.hideTextOnMobile),
        headline: body.headline || null,
        subheadline: body.subheadline || null,
        ctaLabel: body.ctaLabel || null,
        ctaHref: body.ctaHref || null,
        sortOrder: Number(body.sortOrder) || 0,
        isActive: body.isActive ?? true,
      })
      .returning();

    revalidatePath("/"); // refresh the homepage carousel immediately
    return NextResponse.json(banner, { status: 201 });
  } catch (error) {
    console.error("Banner create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
