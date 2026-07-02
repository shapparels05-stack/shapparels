import postgres from "postgres";
async function run() {
  const sql = postgres(process.env.DATABASE_URL!);
  await sql`
    CREATE TABLE IF NOT EXISTS special_offers (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      code text NOT NULL UNIQUE,
      name text NOT NULL,
      slug text NOT NULL UNIQUE,
      description text,
      price numeric(10,2) NOT NULL,
      images jsonb DEFAULT '[]'::jsonb,
      sale_ends_at timestamptz,
      sale_repeat_hours integer,
      is_active boolean NOT NULL DEFAULT true,
      sort_order integer NOT NULL DEFAULT 0,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )`;
  await sql`
    CREATE TABLE IF NOT EXISTS special_offer_items (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      offer_id uuid NOT NULL REFERENCES special_offers(id) ON DELETE CASCADE,
      product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      sort_order integer NOT NULL DEFAULT 0
    )`;
  await sql`CREATE INDEX IF NOT EXISTS special_offer_items_offer_id_idx ON special_offer_items(offer_id)`;
  // Component product ids for a bundle order line, so cancelling restores each.
  await sql`ALTER TABLE order_items ADD COLUMN IF NOT EXISTS bundle_product_ids jsonb`;
  console.log("✓ special_offers, special_offer_items, order_items.bundle_product_ids ensured");
  await sql.end();
}
run();
