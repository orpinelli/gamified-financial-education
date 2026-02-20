import postgres from "postgres";

let client: postgres.Sql | null = null;

function getClient() {
	if (client) {
		return client;
	}

	if (!process.env.DATABASE_URL) {
		throw new Error("DATABASE_URL is not set");
	}

	if (
		/(USER|PASSWORD|HOST|\/DB|@host\b|:\/\/host\b)/i.test(
			process.env.DATABASE_URL,
		)
	) {
		throw new Error("DATABASE_URL is using placeholder values");
	}

	client = postgres(process.env.DATABASE_URL, {
		ssl: "require",
		prepare: false,
	});
	return client;
}

export const sql = ((...args: Parameters<postgres.Sql>) => {
	return getClient()(...args);
}) as postgres.Sql;

export function getDb() {
	return getClient();
}
