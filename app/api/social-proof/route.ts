import { NextResponse } from "next/server";
import { getSocialProofItems } from "@/lib/social-proof";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const items = await getSocialProofItems();
    return NextResponse.json(items);
  } catch {
    return NextResponse.json([]);
  }
}
