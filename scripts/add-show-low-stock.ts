import postgres from "postgres";
async function run(){
  const sql=postgres(process.env.DATABASE_URL!);
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS show_low_stock boolean NOT NULL DEFAULT true`;
  // seed the global threshold setting if missing
  await sql`INSERT INTO site_settings (key, value) VALUES ('low_stock_threshold','10') ON CONFLICT (key) DO NOTHING`;
  console.log("✓ products.show_low_stock + low_stock_threshold setting ensured");
  await sql.end();
}
run();
