import postgres from "postgres";
async function run() {
  const sql = postgres(process.env.DATABASE_URL!);
  await sql`
    CREATE TABLE IF NOT EXISTS promo_popups (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      title text,
      image_url text NOT NULL,
      link_url text,
      frequency text NOT NULL DEFAULT 'daily',
      is_active boolean NOT NULL DEFAULT true,
      sort_order integer NOT NULL DEFAULT 0,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )`;
  console.log("✓ promo_popups ensured");
  await sql.end();
}
run();
