import postgres from "postgres";

async function run() {
  const sql = postgres(process.env.DATABASE_URL!);
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number text`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS courier text`;
  console.log("✓ orders.tracking_number and orders.courier ensured");
  await sql.end();
}

run();
