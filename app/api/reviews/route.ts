import { NextRequest, NextResponse } from "next/server";
import { createReview, getApprovedReviews } from "@/lib/db/queries/reviews";
import { reviewCreateSchema } from "@/lib/validators/review";

// Public: list approved reviews for a product.
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const productId = searchParams.get("productId");

  if (!productId) {
    return NextResponse.json({ error: "productId is required" }, { status: 400 });
  }

  const result = await getApprovedReviews(productId, {
    page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
    limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : 10,
  });

  return NextResponse.json(result);
}

// Public: submit a review (stored as "pending" until an admin approves it).
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = reviewCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { errors: parsed.error.issues },
        { status: 400 }
      );
    }

    // Honeypot: if the hidden field is filled, silently accept without storing.
    if (parsed.data.website) {
      return NextResponse.json({ success: true }, { status: 201 });
    }

    const review = await createReview({
      productId: parsed.data.productId,
      rating: parsed.data.rating,
      title: parsed.data.title || undefined,
      body: parsed.data.body,
      authorName: parsed.data.authorName,
      authorEmail: parsed.data.authorEmail || undefined,
    });

    return NextResponse.json({ success: true, id: review.id }, { status: 201 });
  } catch (error) {
    console.error("Create review error:", error);
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
  }
}
