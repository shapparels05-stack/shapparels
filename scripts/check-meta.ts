import { db } from "../lib/db";
import { products } from "../lib/db/schema";
import { inArray } from "drizzle-orm";
async function main() {
  const rows = await db.select({ code: products.code, name: products.name, slug: products.slug, metaTitle: products.metaTitle, metaDescription: products.metaDescription, previousSlugs: products.previousSlugs }).from(products).where(inArray(products.slug, ["reign-tote-handbag", "aurelia-structured-handbag"]));
  console.log(JSON.stringify(rows, null, 2));
}
main().then(() => process.exit(0));
