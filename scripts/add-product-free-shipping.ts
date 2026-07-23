import postgres from "postgres";
async function run(){
  const sql=postgres(process.env.DATABASE_URL!);
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS free_shipping boolean NOT NULL DEFAULT false`;
  console.log("✓ products.free_shipping ensured (default false)");
  await sql.end();
}
run();
