const fs = require("fs");
const path = require("path");
const postgres = require("postgres");
require("dotenv").config({ path: path.resolve(process.cwd(), ".env.local") });

async function applyRls() {
	if (!process.env.DATABASE_URL) {
		throw new Error("DATABASE_URL is not set");
	}

	const sql = postgres(process.env.DATABASE_URL, {
		ssl: "require",
		prepare: false,
	});

	try {
		const filePath = path.resolve(__dirname, "002-enable-rls.sql");
		const migrationSql = fs.readFileSync(filePath, "utf8");
		await sql.unsafe(migrationSql);
		console.log("RLS aplicado com sucesso.");
	} finally {
		await sql.end();
	}
}

applyRls().catch((error) => {
	console.error("RLS error:", error);
	process.exit(1);
});
