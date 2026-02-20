import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { sql } from "@/lib/db";

function buildCode(): string {
	return Math.random().toString(36).slice(2, 8).toUpperCase();
}

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

		if (
			payload.planType !== "ESCOLAR" ||
			(payload.role !== "ADMIN" && payload.role !== "PROFESSOR") ||
			!payload.schoolId
		) {
			return NextResponse.json({ invites: [] });
		}

		const invites = await sql`
      SELECT id, code, target_role, expires_at, active, uses_count, max_uses, created_at
      FROM school_invites
      WHERE school_id = ${payload.schoolId}
      ORDER BY created_at DESC
      LIMIT 20
    `;

		return NextResponse.json({ invites });
	} catch (error) {
		console.error("List invites error:", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}

export async function POST(request: Request) {
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

		if (
			payload.planType !== "ESCOLAR" ||
			(payload.role !== "ADMIN" && payload.role !== "PROFESSOR") ||
			!payload.schoolId
		) {
			return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
		}

		const body = await request.json();
		const targetRole = body.targetRole === "PROFESSOR" ? "PROFESSOR" : "ALUNO";
		const expiresInDays = Number(body.expiresInDays ?? 30);
		const maxUses = Number(body.maxUses ?? 25);

		const expiresAt = new Date();
		expiresAt.setDate(
			expiresAt.getDate() +
				(Number.isFinite(expiresInDays) ? expiresInDays : 30),
		);

		const code = buildCode();
		const inserted = await sql`
      INSERT INTO school_invites (school_id, code, target_role, created_by_user_id, expires_at, max_uses)
      VALUES (${payload.schoolId}, ${code}, ${targetRole}, ${payload.id}, ${expiresAt.toISOString()}, ${maxUses})
      RETURNING id, code, target_role, expires_at, active, uses_count, max_uses, created_at
    `;

		return NextResponse.json({ invite: inserted[0] });
	} catch (error) {
		console.error("Create invite error:", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
