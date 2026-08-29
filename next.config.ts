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
  // Real HTTP 301s for renamed product slugs, built from previous_slugs at
  // build time. Needed because the /products/[slug] page streams — an in-page
  // permanentRedirect reaches bots as a 200, which Google won't honour. The
  // in-page redirect remains as an instant fallback for slugs renamed after
  // the last deploy.
  async redirects() {
    if (!process.env.DATABASE_URL) return [];
    try {
      const { default: postgres } = await import("postgres");
      const sql = postgres(process.env.DATABASE_URL, { max: 1 });
      const rows = await sql`
        SELECT slug, previous_slugs FROM products
        WHERE previous_slugs IS NOT NULL AND previous_slugs != '[]'::jsonb
      `;
      await sql.end();
      const redirects = rows.flatMap((row) =>
        ((row.previous_slugs as string[]) || []).map((old) => ({
          source: `/products/${old}`,
          destination: `/products/${row.slug}`,
          permanent: true,
        }))
      );
      console.log(`[next.config] ${redirects.length} product slug redirect(s) from DB`);
      return redirects;
    } catch (e) {
      console.warn("[next.config] could not load slug redirects:", e);
      return [];
    }
  },
};

export default nextConfig;
