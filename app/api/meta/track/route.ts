import { NextResponse } from "next/server";
import { sendCapiEvents, capiContextFromRequest } from "@/lib/meta-capi";

export const dynamic = "force-dynamic";

// Browser-initiated events (ViewContent, AddToCart, InitiateCheckout) are
// mirrored here with the SAME event_id the Pixel used, so Meta deduplicates
// the browser + server copies into one. Match signals come from the request
// (IP, user-agent, _fbp/_fbc cookies).
export async function POST(req: Request) {
  try {
    const { eventName, eventId, eventSourceUrl, customData } = await req.json();
    if (!eventName || !eventId) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    await sendCapiEvents([
      {
        eventName,
        eventId,
        eventSourceUrl,
        userData: capiContextFromRequest(req),
        customData,
      },
    ]);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
