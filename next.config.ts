import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Serve images straight from Cloudflare R2 — the Vercel optimizer hit its
    // quota (HTTP 402). Uploads are downscaled to <=1600px WebP on the client,
    // so images stay small for mobile without the optimizer.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.r2.dev",
      },
      {
        protocol: "https",
        hostname: "*.cloudflare.com",
      },
    ],
  },
};

export default nextConfig;
