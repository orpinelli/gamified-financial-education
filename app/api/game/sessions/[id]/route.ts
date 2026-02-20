import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function DELETE(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
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

		const { id } = await params;
		const sessionId = Number(id);
		if (!Number.isFinite(sessionId)) {
			return NextResponse.json({ error: "Sessao invalida" }, { status: 400 });
		}

		const deleted = await sql`
      DELETE FROM game_sessions
      WHERE id = ${sessionId} AND user_id = ${payload.id}
      RETURNING id
    `;

		if (deleted.length === 0) {
			return NextResponse.json(
				{ error: "Sessao nao encontrada" },
				{ status: 404 },
			);
		}

		return NextResponse.json({ ok: true });
	} catch (error) {
		console.error("Delete game session error:", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
