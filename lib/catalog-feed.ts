import { db } from "@/lib/db";
import {
  products,
  productVariants,
  productImages,
  productOptionTypes,
  productOptionValues,
  categories,
} from "@/lib/db/schema";
import { eq, asc, inArray } from "drizzle-orm";
import { SITE_URL, SITE_NAME, CURRENCY } from "@/lib/constants";

// Builds a Meta/Google product catalog feed (RSS 2.0 with g: fields).
// One <item> per variant, grouped under the product via g:item_group_id.

function esc(s: string): string {
  return (s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function money(value: string | number): string {
  const n = typeof value === "string" ? parseFloat(value) : value;
  return `${n.toFixed(2)} ${CURRENCY}`; // e.g. "3200.00 PKR"
}

// Regular price + optional sale price (when a compare-at markdown exists).
function priceFields(price: string, compareAt: string | null | undefined) {
  const cur = parseFloat(price);
  const cmp = compareAt ? parseFloat(compareAt) : null;
  if (cmp && cmp > cur) return { price: money(cmp), salePrice: money(cur) };
  return { price: money(cur), salePrice: undefined as string | undefined };
}

const norm = (s: string) => s.trim().toLowerCase();

interface FeedItem {
  id: string;
  itemGroupId?: string;
  title: string;
  description: string;
  link: string;
  imageLink: string;
  additionalImages: string[];
  availability: "in stock" | "out of stock";
  price: string;
  salePrice?: string;
  brand: string;
  condition: "new";
  productType?: string;
  color?: string;
  size?: string;
}

function itemToXml(it: FeedItem): string {
  const lines: string[] = ["    <item>"];
  const tag = (name: string, val?: string) => {
    if (val) lines.push(`      <g:${name}>${esc(val)}</g:${name}>`);
  };
  tag("id", it.id);
  if (it.itemGroupId) tag("item_group_id", it.itemGroupId);
  tag("title", it.title);
  tag("description", it.description);
  lines.push(`      <g:link>${esc(it.link)}</g:link>`);
  lines.push(`      <g:image_link>${esc(it.imageLink)}</g:image_link>`);
  for (const img of it.additionalImages.slice(0, 20)) {
    lines.push(`      <g:additional_image_link>${esc(img)}</g:additional_image_link>`);
  }
  tag("availability", it.availability);
  tag("condition", it.condition);
  tag("price", it.price);
  tag("sale_price", it.salePrice);
  tag("brand", it.brand);
  tag("product_type", it.productType);
  tag("color", it.color);
  tag("size", it.size);
  lines.push("    </item>");
  return lines.join("\n");
}

export async function buildMetaCatalogXml(): Promise<string> {
  const prods = await db
    .select({
      id: products.id,
      code: products.code,
      name: products.name,
      slug: products.slug,
      description: products.description,
      shortDescription: products.shortDescription,
      basePrice: products.basePrice,
      compareAtPrice: products.compareAtPrice,
      stock: products.stock,
      categoryName: categories.name,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.isActive, true))
    .orderBy(asc(products.name));

  const ids = prods.map((p) => p.id);
  const items: FeedItem[] = [];

  if (ids.length > 0) {
    const [variants, imgs, optTypes, optValues] = await Promise.all([
      db
        .select({
          id: productVariants.id,
          productId: productVariants.productId,
          sku: productVariants.sku,
          price: productVariants.price,
          compareAtPrice: productVariants.compareAtPrice,
          stock: productVariants.stock,
          optionValueIds: productVariants.optionValueIds,
          isActive: productVariants.isActive,
        })
        .from(productVariants)
        .where(inArray(productVariants.productId, ids)),
      db
        .select({
          productId: productImages.productId,
          url: productImages.url,
          optionValue: productImages.optionValue,
        })
        .from(productImages)
        .where(inArray(productImages.productId, ids))
        .orderBy(asc(productImages.sortOrder)),
      db
        .select({ id: productOptionTypes.id, name: productOptionTypes.name })
        .from(productOptionTypes)
        .where(inArray(productOptionTypes.productId, ids)),
      db
        .select({
          id: productOptionValues.id,
          value: productOptionValues.value,
          optionTypeId: productOptionValues.optionTypeId,
        })
        .from(productOptionValues)
        .innerJoin(productOptionTypes, eq(productOptionTypes.id, productOptionValues.optionTypeId))
        .where(inArray(productOptionTypes.productId, ids)),
    ]);

    const typeNameById = new Map(optTypes.map((t) => [t.id, t.name]));
    // valueId -> { value, typeName }
    const valueMap = new Map(
      optValues.map((v) => [v.id, { value: v.value, typeName: typeNameById.get(v.optionTypeId) || "" }])
    );
    const imagesByProduct = new Map<string, { url: string; optionValue: string | null }[]>();
    for (const im of imgs) {
      const list = imagesByProduct.get(im.productId) ?? [];
      list.push({ url: im.url, optionValue: im.optionValue });
      imagesByProduct.set(im.productId, list);
    }
    const variantsByProduct = new Map<string, typeof variants>();
    for (const v of variants) {
      if (!v.isActive) continue;
      const list = variantsByProduct.get(v.productId) ?? [];
      list.push(v);
      variantsByProduct.set(v.productId, list);
    }

    for (const p of prods) {
      const link = `${SITE_URL}/products/${p.slug}`;
      const description = (p.description || p.shortDescription || p.name).slice(0, 5000) || p.name;
      const productImgs = imagesByProduct.get(p.id) ?? [];
      const pv = variantsByProduct.get(p.id) ?? [];

      if (pv.length > 0) {
        for (const v of pv) {
          // Colour/size + label from this variant's option values.
          let color: string | undefined;
          let size: string | undefined;
          const labelParts: string[] = [];
          for (const ovId of v.optionValueIds ?? []) {
            const ov = valueMap.get(ovId);
            if (!ov) continue;
            const value = ov.value.trim();
            labelParts.push(value);
            const tn = ov.typeName.toLowerCase();
            if (tn.includes("colour") || tn.includes("color")) color = value;
            else if (tn.includes("size")) size = value;
          }
          const label = labelParts.join(" / ");

          // Variant-specific images (tagged with the colour) + general ones.
          let variantImgs = productImgs;
          const colourLabels = new Set(
            (v.optionValueIds ?? [])
              .map((id) => valueMap.get(id)?.value)
              .filter(Boolean)
              .map((l) => norm(l as string))
          );
          if (colourLabels.size > 0) {
            const tagged = productImgs.filter((i) => i.optionValue && colourLabels.has(norm(i.optionValue)));
            if (tagged.length > 0) {
              const general = productImgs.filter((i) => !i.optionValue);
              variantImgs = [...tagged, ...general];
            }
          }
          const imageLink = variantImgs[0]?.url;
          if (!imageLink) continue; // Meta requires an image

          const { price, salePrice } = priceFields(v.price, v.compareAtPrice ?? p.compareAtPrice);
          items.push({
            id: v.sku?.trim() || `${p.id}_${v.id}`,
            // Group key = product id, matching the content_ids our Pixel/CAPI
            // report, so dynamic (retargeting) ads can link viewed products.
            itemGroupId: p.id,
            title: `${[p.code?.trim(), p.name.trim()].filter(Boolean).join(" ")}${label ? " - " + label : ""}`,
            description,
            link,
            imageLink,
            additionalImages: variantImgs.slice(1).map((i) => i.url),
            availability: v.stock > 0 ? "in stock" : "out of stock",
            price,
            salePrice,
            brand: SITE_NAME,
            condition: "new",
            productType: p.categoryName || undefined,
            color,
            size,
          });
        }
      } else {
        const imageLink = productImgs[0]?.url;
        if (!imageLink) continue;
        const { price, salePrice } = priceFields(p.basePrice, p.compareAtPrice);
        items.push({
          id: p.id, // matches the content_ids our Pixel/CAPI report
          title: `${[p.code?.trim(), p.name.trim()].filter(Boolean).join(" ")}`,
          description,
          link,
          imageLink,
          additionalImages: productImgs.slice(1).map((i) => i.url),
          availability: p.stock > 0 ? "in stock" : "out of stock",
          price,
          salePrice,
          brand: SITE_NAME,
          condition: "new",
          productType: p.categoryName || undefined,
        });
      }
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${esc(SITE_NAME)}</title>
    <link>${esc(SITE_URL)}</link>
    <description>${esc(SITE_NAME)} product catalog</description>
${items.map(itemToXml).join("\n")}
  </channel>
</rss>`;
}
