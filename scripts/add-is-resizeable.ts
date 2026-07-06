import postgres from "postgres";
async function run(){
  const sql=postgres(process.env.DATABASE_URL!);
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS is_resizeable boolean NOT NULL DEFAULT false`;
  console.log("✓ products.is_resizeable ensured");
  await sql.end();
}
run();
