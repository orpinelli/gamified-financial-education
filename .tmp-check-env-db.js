require('dotenv').config({ path: '.env.local' });
const postgres = require('postgres');

(async () => {
  const sql = postgres(process.env.DATABASE_URL, {
    ssl: 'require',
    prepare: false,
    connect_timeout: 8,
    max: 1,
  });

  try {
    const rows = await sql`select current_user as u`;
    console.log('OK', rows[0]);
  } catch (error) {
    console.log('FAIL', error.code, error.message);
    process.exitCode = 1;
  } finally {
    try { await sql.end({ timeout: 1 }); } catch {}
  }
})();
