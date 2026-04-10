const fs = require("fs");
const path = require("path");
const postgres = require("postgres");
require("dotenv").config({ path: path.resolve(process.cwd(), ".env.local") });

async function runMigration() {
	if (!process.env.DATABASE_URL) {
		throw new Error("DATABASE_URL is not set");
	}

	const sql = postgres(process.env.DATABASE_URL, {
		ssl: "require",
		prepare: false,
	});

	try {
		const migrationPath = path.resolve(__dirname, "003-add-user-active.sql");
		const migrationSql = fs.readFileSync(migrationPath, "utf8");

		await sql.unsafe(migrationSql);
		console.log("Migracao 003-add-user-active concluida com sucesso.");
	} finally {
		await sql.end();
	}
}

runMigration().catch((error) => {
	console.error("Migration error:", error);
	process.exit(1);
});
