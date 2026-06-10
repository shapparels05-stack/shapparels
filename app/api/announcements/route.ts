import { NextRequest, NextResponse } from "next/server";
import { getAllAnnouncements } from "@/lib/db/queries/announcements";
import { db } from "@/lib/db";
import { announcements } from "@/lib/db/schema";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export async function GET() {
  const all = await getAllAnnouncements();
  return NextResponse.json(all);
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    if (!body.text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const [announcement] = await db
      .insert(announcements)
      .values({
        text: body.text,
        icon: body.icon || null,
        href: body.href || null,
        sortOrder: Number(body.sortOrder) || 0,
        isActive: body.isActive ?? true,
      })
      .returning();

    revalidatePath("/", "layout"); // bar is site-wide
    return NextResponse.json(announcement, { status: 201 });
  } catch (error) {
    console.error("Announcement create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
