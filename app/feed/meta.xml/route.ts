import { buildMetaCatalogXml } from "@/lib/catalog-feed";

// Product catalog feed for Meta Commerce Manager (RSS 2.0, one item per
// variant, grouped by product). Cached for an hour; Meta re-fetches on its own
// schedule to keep the catalog in sync.
export const revalidate = 3600;

export async function GET() {
  const xml = await buildMetaCatalogXml();
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
