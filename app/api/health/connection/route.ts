import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET() {
	const envCheck = {
		databaseUrl: Boolean(process.env.DATABASE_URL),
		supabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
		supabaseKey: Boolean(
			process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
				process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
		),
	};

	try {
		await sql`SELECT 1 as ok`;
		return NextResponse.json({
			ok: true,
			env: envCheck,
			database: "connected",
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : "unknown error";

		let hint = "Verifique DATABASE_URL no .env.local";
		if (message.includes("placeholder")) {
			hint = "DATABASE_URL ainda com valor de exemplo";
		} else if (message.includes("Tenant or user not found")) {
			hint =
				"Usuario/host do pooler Supabase incorreto (copie URI exata do painel)";
		} else if (message.includes("password authentication failed")) {
			hint =
				"Senha do banco invalida. Redefina em Supabase > Project Settings > Database > Reset database password e atualize DATABASE_URL";
		} else if (message.includes("ETIMEDOUT")) {
			hint = "Host direto IPv6 sem suporte local; use pooler IPv4";
		}

		return NextResponse.json(
			{
				ok: false,
				env: envCheck,
				database: "failed",
				error: message,
				hint,
			},
			{ status: 500 },
		);
	}
}
