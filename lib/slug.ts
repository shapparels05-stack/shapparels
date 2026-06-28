// Normalize any string into a safe URL slug: lowercase, alphanumeric + hyphens,
// no spaces, no leading/trailing/duplicate hyphens. Guarantees a value that
// matches /^[a-z0-9-]+$/ so product URLs never 404 from bad characters.
export function normalizeSlug(input: string): string {
  return (input || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
