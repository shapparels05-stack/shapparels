import { NextRequest, NextResponse } from "next/server";
import { getSiteSettings, setSiteSettings } from "@/lib/db/queries/settings";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

const ALLOWED_KEYS = ["facebook_url", "instagram_url", "low_stock_threshold"];

export async function GET() {
  const settings = await getSiteSettings();
  return NextResponse.json(settings);
}

export async function PUT(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const updates: Record<string, string> = {};
    for (const key of ALLOWED_KEYS) {
      if (typeof body[key] === "string") updates[key] = body[key].trim();
    }
    await setSiteSettings(updates);
    // Social links appear site-wide (footer).
    revalidatePath("/", "layout");
    return NextResponse.json({ ok: true, settings: await getSiteSettings() });
  } catch (error) {
    console.error("Settings update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
