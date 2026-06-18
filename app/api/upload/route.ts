import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { r2Client } from "@/lib/r2/client";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { headers } from "next/headers";
import sharp from "sharp";
import { toThumbKey } from "@/lib/images";

const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME!;

export async function POST(request: NextRequest) {
  // Verify admin session
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate content type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPEG, PNG, WebP, AVIF" },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Max 10MB" },
        { status: 400 }
      );
    }

    // Generate unique key
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "-").toLowerCase();
    const key = `products/${timestamp}-${sanitizedName}`;

    // Upload to R2 from server
    const buffer = Buffer.from(await file.arrayBuffer());
    await r2Client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      })
    );

    const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

    // Generate a small ~500px WebP thumbnail alongside the original, stored as a
    // static file in R2 (cards/carousels use it — no per-request transform cost).
    let thumbUrl = publicUrl;
    try {
      const thumbBuffer = await sharp(buffer)
        .resize({ width: 500, withoutEnlargement: true })
        .webp({ quality: 72 })
        .toBuffer();
      const thumbKey = toThumbKey(key);
      await r2Client.send(
        new PutObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: thumbKey,
          Body: thumbBuffer,
          ContentType: "image/webp",
        })
      );
      thumbUrl = `${process.env.R2_PUBLIC_URL}/${thumbKey}`;
    } catch (e) {
      console.error("Thumbnail generation failed (using full image):", e);
    }

    return NextResponse.json({ url: publicUrl, thumbUrl, key });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
