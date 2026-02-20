const postgres = require('postgres');
const pwd = encodeURIComponent('@GaK13141924');
const urls = [
  `postgresql://postgres.xcqwovjlovdrfaauiioa:${pwd}@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require`,
  `postgresql://postgres:${pwd}@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require`
];
(async()=>{
  for(const url of urls){
    const sql = postgres(url,{ssl:'require',prepare:false,connect_timeout:8,max:1});
    try{const r=await sql`select current_user as u`; console.log('OK',url,'->',r[0].u); await sql.end();}
    catch(e){console.log('FAIL',url,'->',e.code,e.message); try{await sql.end({timeout:1});}catch{}}
  }
})();
