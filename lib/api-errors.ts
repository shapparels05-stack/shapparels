// Turns raw API/database errors into messages an admin can actually act on,
// instead of a generic "Internal server error".

type PgError = { code?: string; detail?: string; constraint_name?: string };

// Drizzle wraps the driver error (DrizzleQueryError -> cause). Walk the cause
// chain until we find something carrying a Postgres error code.
function findPgError(error: unknown): PgError | null {
  let current: unknown = error;
  for (let depth = 0; depth < 5 && current; depth++) {
    if (typeof current === "object" && "code" in (current as object)) {
      const candidate = current as PgError;
      if (typeof candidate.code === "string" && /^\d{5}$/.test(candidate.code)) {
        return candidate;
      }
    }
    current = (current as { cause?: unknown }).cause;
  }
  return null;
}

// Column name from a unique-violation detail like: Key (slug)=(tote-bag) already exists.
function uniqueColumn(pg: PgError): string | null {
  const m = pg.detail?.match(/Key \(([^)]+)\)=/);
  return m ? m[1] : null;
}

/**
 * Maps a caught error to a { message, status } the admin UI can show.
 * Returns null when the error isn't one we recognise (caller falls back to a
 * generic 500 after logging).
 */
export function knownDbError(error: unknown): { message: string; status: number } | null {
  const pg = findPgError(error);
  if (!pg) return null;

  // 23505 = unique constraint violation
  if (pg.code === "23505") {
    const column = uniqueColumn(pg);
    if (column === "slug") {
      return {
        message:
          "This URL/slug is already used by another product (it may be archived). Change the slug and save again.",
        status: 409,
      };
    }
    return {
      message: `That ${column ?? "value"} is already in use — pick a different one.`,
      status: 409,
    };
  }

  // 23503 = foreign key violation (e.g. category was deleted meanwhile)
  if (pg.code === "23503") {
    return {
      message:
        "A selected item (like the category) no longer exists. Refresh the page and pick again.",
      status: 409,
    };
  }

  // 22P02 / 22003 = bad data for the column type (malformed number/uuid)
  if (pg.code === "22P02" || pg.code === "22003") {
    return {
      message: "One of the fields has an invalid value. Check prices and numbers, then save again.",
      status: 400,
    };
  }

  return null;
}

/**
 * Formats a zod v4 validation error into one readable line, e.g.
 * "basePrice: Price must be positive; name: Product name is required".
 * (zod v4 removed `.errors` — issues live on `.issues`.)
 */
export function formatZodError(error: unknown): string {
  const issues = (error as { issues?: { path?: PropertyKey[]; message?: string }[] }).issues;
  if (!Array.isArray(issues) || issues.length === 0) return "Invalid form data.";
  return issues
    .map((issue) => {
      const field = issue.path?.length ? issue.path.join(".") : "form";
      return `${field}: ${issue.message ?? "invalid value"}`;
    })
    .join("; ");
}
