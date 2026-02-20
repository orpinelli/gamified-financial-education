import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

const sql = neon(process.env.DATABASE_URL);

async function seedPasswords() {
  const hash = await bcrypt.hash("senha123", 10);
  console.log("Hash generated:", hash);

  await sql`UPDATE users SET password_hash = ${hash} WHERE email = 'admin@escola.com'`;
  await sql`UPDATE users SET password_hash = ${hash} WHERE email = 'professor@escola.com'`;
  await sql`UPDATE users SET password_hash = ${hash} WHERE email = 'aluno@escola.com'`;

  console.log("Passwords updated for all demo users (senha123)");
}

seedPasswords().catch(console.error);
