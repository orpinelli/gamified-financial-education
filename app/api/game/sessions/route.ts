import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function GET() {
	try {
		const cookieStore = await cookies();
		const token = cookieStore.get("token")?.value;
		if (!token) {
			return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
		}

		const payload = await verifyToken(token);
		if (!payload) {
			return NextResponse.json({ error: "Token invalido" }, { status: 401 });
		}

		const sessions = await sql`
      SELECT id, character_name, profession_id, current_day, status, updated_at
      FROM game_sessions
      WHERE user_id = ${payload.id}
      ORDER BY updated_at DESC
      LIMIT 20
    `;

		return NextResponse.json({ sessions });
	} catch (error) {
		console.error("List game sessions error:", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
