import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { sql } from "@/lib/db";

// GET - Return all active game cards grouped by category
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

		const cards = await sql`
      SELECT
        id, category, emoji, title, description,
        money_effect, happiness_effect, knowledge_effect, score_effect,
        options,
        deferred_money_effect, deferred_happiness_effect
      FROM game_cards
      WHERE active = true
      ORDER BY category, id
    `;

		return NextResponse.json({ cards });
	} catch (error) {
		console.error("Get cards error:", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
