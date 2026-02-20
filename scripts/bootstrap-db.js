const fs = require("fs");
const path = require("path");
const postgres = require("postgres");
require("dotenv").config({ path: path.resolve(process.cwd(), ".env.local") });

async function bootstrapDb() {
	if (!process.env.DATABASE_URL) {
		throw new Error("DATABASE_URL is not set");
	}

	const sql = postgres(process.env.DATABASE_URL, {
		ssl: "require",
		prepare: false,
	});

	try {
		const migrationPath = path.resolve(__dirname, "001-create-tables.sql");
		const migrationSql = fs.readFileSync(migrationPath, "utf8");

		await sql.unsafe(migrationSql);
		console.log("Migracao concluida com sucesso.");
	} finally {
		await sql.end();
	}
}

bootstrapDb().catch((error) => {
	console.error("Bootstrap DB error:", error);
	process.exit(1);
});
