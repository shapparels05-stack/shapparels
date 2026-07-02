import postgres from "postgres";
async function run() {
  const sql = postgres(process.env.DATABASE_URL!);
  await sql`ALTER TABLE special_offer_items ADD COLUMN IF NOT EXISTS variant_id uuid REFERENCES product_variants(id) ON DELETE SET NULL`;
  console.log("✓ special_offer_items.variant_id ensured");
  await sql.end();
}
run();
