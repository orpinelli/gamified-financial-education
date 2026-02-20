const postgres = require("postgres");
const bcrypt = require("bcryptjs");
const path = require("path");
require("dotenv").config({ path: path.resolve(process.cwd(), ".env.local") });

async function seedPasswords() {
	if (!process.env.DATABASE_URL) {
		throw new Error("DATABASE_URL is not set");
	}

	const sql = postgres(process.env.DATABASE_URL, {
		ssl: "require",
		prepare: false,
	});

	try {
		const hash = await bcrypt.hash("senha123", 10);

		const schools = await sql`
      SELECT id FROM schools ORDER BY id ASC LIMIT 1
    `;

		let schoolId = schools[0]?.id ?? null;

		if (!schoolId) {
			const createdSchool = await sql`
        INSERT INTO schools (name, plan_type, plan_price)
        VALUES ('Escola Demo', 'ESCOLAR', 399.00)
        RETURNING id
      `;
			schoolId = createdSchool[0].id;
		}

		await sql`
      INSERT INTO users (email, password_hash, name, role, school_id, plan_type, plan_price)
      VALUES ('admin@escola.com', ${hash}, 'Admin Demo', 'ADMIN', ${schoolId}, 'ESCOLAR', 399.00)
      ON CONFLICT (email) DO UPDATE
      SET password_hash = EXCLUDED.password_hash,
          name = EXCLUDED.name,
          role = EXCLUDED.role,
          school_id = EXCLUDED.school_id,
          plan_type = EXCLUDED.plan_type,
          plan_price = EXCLUDED.plan_price
    `;

		await sql`
      INSERT INTO users (email, password_hash, name, role, school_id, plan_type, plan_price)
      VALUES ('professor@escola.com', ${hash}, 'Professor Demo', 'PROFESSOR', ${schoolId}, 'ESCOLAR', 399.00)
      ON CONFLICT (email) DO UPDATE
      SET password_hash = EXCLUDED.password_hash,
          name = EXCLUDED.name,
          role = EXCLUDED.role,
          school_id = EXCLUDED.school_id,
          plan_type = EXCLUDED.plan_type,
          plan_price = EXCLUDED.plan_price
    `;

		await sql`
      INSERT INTO users (email, password_hash, name, role, school_id, plan_type, plan_price)
      VALUES ('aluno@escola.com', ${hash}, 'Aluno Demo', 'ALUNO', ${schoolId}, 'FREE', 0.00)
      ON CONFLICT (email) DO UPDATE
      SET password_hash = EXCLUDED.password_hash,
          name = EXCLUDED.name,
          role = EXCLUDED.role,
          school_id = EXCLUDED.school_id,
          plan_type = EXCLUDED.plan_type,
          plan_price = EXCLUDED.plan_price
    `;

		console.log("Usuarios demo prontos. Senha: senha123");
	} finally {
		await sql.end();
	}
}

seedPasswords().catch((error) => {
	console.error("Seed error:", error);
	process.exit(1);
});
