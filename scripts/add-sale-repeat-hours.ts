import postgres from "postgres";
async function run() {
  const sql = postgres(process.env.DATABASE_URL!);
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS sale_repeat_hours integer`;
  console.log("✓ products.sale_repeat_hours ensured");
  await sql.end();
}
run();
