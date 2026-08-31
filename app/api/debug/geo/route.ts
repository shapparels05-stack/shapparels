import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Echoes the Vercel IP-geo headers for the CALLER's own request, so we can
// verify which location fields (city/region/postcode) actually resolve for
// local ISPs. Returns only the requester's own info — no stored data.
export function GET(req: Request) {
  const h = req.headers;
  return NextResponse.json({
    city: h.get("x-vercel-ip-city"),
    region: h.get("x-vercel-ip-country-region"),
    postalCode: h.get("x-vercel-ip-postal-code"),
    country: h.get("x-vercel-ip-country"),
  });
}
