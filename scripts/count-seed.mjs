import pg from "pg";

const client = new pg.Client({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://postgres:k3izBoCOOehZ76vt@db.xzlvbukpblxxuoutxyqe.supabase.co:5432/postgres",
  ssl: { rejectUnauthorized: false },
});

await client.connect();
const r = await client.query(`
  select
    (select count(*)::int from auth.users where email like 'seed%@valentines.seed') as seeds,
    (select count(*)::int from public.profiles) as profiles,
    (select count(*)::int from public.reels) as reels
`);
console.log(r.rows[0]);
await client.end();
