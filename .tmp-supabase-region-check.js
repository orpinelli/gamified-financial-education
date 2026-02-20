const postgres = require('postgres');
const regions = [
  'us-east-1','us-west-1','us-west-2','sa-east-1','eu-west-1','eu-west-2','eu-central-1','ap-southeast-1','ap-northeast-1'
];

(async () => {
  for (const region of regions) {
    const url = `postgresql://postgres.xcqwovjlovdrfaauiioa:%40%23GaK13141924@aws-0-${region}.pooler.supabase.com:6543/postgres?sslmode=require`;
    const sql = postgres(url, { ssl: 'require', prepare: false, connect_timeout: 5, max: 1, idle_timeout: 5 });
    try {
      await sql`select 1 as ok`;
      console.log('OK', region);
      await sql.end();
      process.exit(0);
    } catch (error) {
      const message = error && error.message ? error.message : String(error);
      console.log('FAIL', region, '-', message.slice(0, 140));
      try { await sql.end({ timeout: 1 }); } catch {}
    }
  }
  process.exit(1);
})();
