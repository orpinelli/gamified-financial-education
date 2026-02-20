const postgres = require('postgres');

const regions = [
  'us-east-1','us-east-2','us-west-1','us-west-2','sa-east-1','ca-central-1',
  'eu-west-1','eu-west-2','eu-west-3','eu-central-1','eu-north-1',
  'ap-southeast-1','ap-southeast-2','ap-northeast-1','ap-northeast-2','ap-south-1'
];

const users = ['postgres', 'postgres.xcqwovjlovdrfaauiioa'];
const ports = [6543, 5432];
const password = encodeURIComponent('@#GaK13141924');

(async () => {
  for (const region of regions) {
    for (const user of users) {
      for (const port of ports) {
        const host = `aws-0-${region}.pooler.supabase.com`;
        const url = `postgresql://${user}:${password}@${host}:${port}/postgres?sslmode=require`;
        const sql = postgres(url, { ssl: 'require', prepare: false, connect_timeout: 5, max: 1, idle_timeout: 5 });
        try {
          await sql`select current_database() as db`;
          console.log('OK', { region, user, port, host });
          await sql.end();
          process.exit(0);
        } catch (error) {
          const msg = (error && error.message ? error.message : String(error)).slice(0, 100);
          console.log('FAIL', region, user, port, '-', msg);
          try { await sql.end({ timeout: 1 }); } catch {}
        }
      }
    }
  }
  process.exit(1);
})();
