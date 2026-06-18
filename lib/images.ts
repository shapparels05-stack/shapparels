// Product images store a pre-generated ~500px WebP thumbnail alongside the
// original, at a deterministic key (…/name.webp -> …/name_thumb.webp). Cards
// and carousels use the thumbnail (served statically from R2 — no per-request
// transform quota); the full image is used on product detail / hero.

export function toThumbUrl(url: string): string {
  // Replace the file extension with _thumb.webp. Avoid double-suffixing.
  if (/_thumb\.webp(\?.*)?$/i.test(url)) return url;
  return url.replace(/\.[a-z0-9]+(\?.*)?$/i, "_thumb.webp");
}

export function toThumbKey(key: string): string {
  if (/_thumb\.webp$/i.test(key)) return key;
  return key.replace(/\.[a-z0-9]+$/i, "_thumb.webp");
}
