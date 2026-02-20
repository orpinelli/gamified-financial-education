const fs = require("fs");
const path = require("path");
const readline = require("readline");
const postgres = require("postgres");
const bcrypt = require("bcryptjs");
require("dotenv").config({ path: path.resolve(process.cwd(), ".env.local") });

const ENV_PATH = path.resolve(process.cwd(), ".env.local");
const MIGRATION_PATH = path.resolve(__dirname, "001-create-tables.sql");

function ask(question) {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});
	return new Promise((resolve) => {
		rl.question(question, (answer) => {
			rl.close();
			resolve(answer.trim());
		});
	});
}

function upsertEnv(key, value) {
	const line = `${key}="${value}"`;
	let lines = [];

	if (fs.existsSync(ENV_PATH)) {
		lines = fs.readFileSync(ENV_PATH, "utf8").split(/\r?\n/);
	}

	const index = lines.findIndex((l) => l.startsWith(`${key}=`));
	if (index >= 0) {
		lines[index] = line;
	} else {
		lines.push(line);
	}

	fs.writeFileSync(ENV_PATH, lines.filter(Boolean).join("\n") + "\n", "utf8");
}

async function tryConnect(url) {
	const sql = postgres(url, {
		ssl: "require",
		prepare: false,
		connect_timeout: 8,
		max: 1,
	});

	try {
		await sql`select 1 as ok`;
		await sql.end();
		return true;
	} catch {
		try {
			await sql.end({ timeout: 1 });
		} catch {}
		return false;
	}
}

function getProjectRef() {
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
	const match = supabaseUrl.match(/^https:\/\/([a-z0-9-]+)\.supabase\.co$/i);
	return match ? match[1] : null;
}

function buildCandidates(projectRef, passwordRaw) {
	const password = encodeURIComponent(passwordRaw);
	const regions = [
		"us-east-1",
		"us-west-1",
		"us-west-2",
		"sa-east-1",
		"eu-west-1",
		"eu-west-2",
		"eu-central-1",
		"ap-southeast-1",
		"ap-southeast-2",
		"ap-northeast-1",
	];

	const candidates = [];

	for (const region of regions) {
		candidates.push(
			`postgresql://postgres.${projectRef}:${password}@aws-0-${region}.pooler.supabase.com:6543/postgres?sslmode=require`,
		);
		candidates.push(
			`postgresql://postgres:${password}@aws-0-${region}.pooler.supabase.com:6543/postgres?sslmode=require`,
		);
	}

	candidates.push(
		`postgresql://postgres:${password}@db.${projectRef}.supabase.co:5432/postgres?sslmode=require`,
	);

	return candidates;
}

async function migrateAndSeed(databaseUrl) {
	const sql = postgres(databaseUrl, {
		ssl: "require",
		prepare: false,
		max: 1,
	});

	try {
		const migrationSql = fs.readFileSync(MIGRATION_PATH, "utf8");
		await sql.unsafe(migrationSql);

		const hash = await bcrypt.hash("senha123", 10);

		const schools = await sql`SELECT id FROM schools ORDER BY id ASC LIMIT 1`;
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
	} finally {
		await sql.end();
	}
}

async function main() {
	const projectRef = getProjectRef();
	if (!projectRef) {
		throw new Error(
			"NEXT_PUBLIC_SUPABASE_URL ausente/invalida no .env.local. Exemplo: https://<project-ref>.supabase.co",
		);
	}

	const password = await ask("Senha do banco Supabase (postgres): ");
	if (!password) {
		throw new Error("Senha nao informada.");
	}

	const manualUri = await ask(
		"Cole a URI do Connection Pooling (Session/Transaction) se tiver, ou pressione Enter para auto-detect: ",
	);

	if (manualUri) {
		const ok = await tryConnect(manualUri);
		if (!ok) {
			throw new Error(
				"Falha ao conectar com a URI informada. Se for Direct (db.<ref>.supabase.co:5432), nao funciona em rede IPv4. Use Connection Pooling no painel.",
			);
		}

		upsertEnv("DATABASE_URL", manualUri);
		process.env.DATABASE_URL = manualUri;
		await migrateAndSeed(manualUri);

		console.log("Setup Supabase concluido.");
		console.log("DATABASE_URL salva no .env.local");
		console.log(
			"Usuarios demo: admin@escola.com, professor@escola.com, aluno@escola.com",
		);
		console.log("Senha demo: senha123");
		return;
	}

	const candidates = buildCandidates(projectRef, password);

	let workingUrl = null;
	for (const url of candidates) {
		const ok = await tryConnect(url);
		if (ok) {
			workingUrl = url;
			break;
		}
	}

	if (!workingUrl) {
		throw new Error(
			"Nao foi possivel conectar no Supabase. Confirme a senha e, no painel, copie a URI de Connection Pooling (Session Pooler em rede IPv4).",
		);
	}

	upsertEnv("DATABASE_URL", workingUrl);
	process.env.DATABASE_URL = workingUrl;

	await migrateAndSeed(workingUrl);

	console.log("Setup Supabase concluido.");
	console.log("DATABASE_URL salva no .env.local");
	console.log(
		"Usuarios demo: admin@escola.com, professor@escola.com, aluno@escola.com",
	);
	console.log("Senha demo: senha123");
}

main().catch((error) => {
	console.error("setup:supabase error:", error.message || error);
	process.exit(1);
});
