import postgres from "postgres";
async function run(){
  const sql=postgres(process.env.DATABASE_URL!);
  await sql`ALTER TABLE special_offers ADD COLUMN IF NOT EXISTS free_shipping boolean NOT NULL DEFAULT false`;
  console.log("✓ special_offers.free_shipping ensured");
  await sql.end();
}
run();
