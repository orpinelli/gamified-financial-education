const postgres = require('postgres');
const password = encodeURIComponent('@GaK13141924');
const tries = [
  'postgresql://postgres.xcqwovjlovdrfaauiioa:' + password + '@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require',
  'postgresql://postgres.xcqwovjlovdrfaauiioa:' + password + '@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require',
  'postgresql://postgres:' + password + '@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require',
  'postgresql://postgres:' + password + '@db.xcqwovjlovdrfaauiioa.supabase.co:5432/postgres?sslmode=require'
];

(async () => {
  for (const url of tries) {
    const sql = postgres(url, { ssl: 'require', prepare: false, connect_timeout: 8, max: 1 });
    try {
      const rows = await sql`select current_database() as db, current_user as usr`;
      console.log('OK', url);
      console.log(rows[0]);
      await sql.end();
      process.exit(0);
    } catch (error) {
      const msg = error && error.message ? error.message : String(error);
      console.log('FAIL', url, '-', msg.slice(0, 180));
      try { await sql.end({ timeout: 1 }); } catch {}
    }
  }
  process.exit(1);
})();
