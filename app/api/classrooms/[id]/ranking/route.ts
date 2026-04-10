import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function GET(
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

		if (payload.planType !== "ESCOLAR") {
			return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
		}

		const { id } = await params;
		const classroomId = Number(id);
		if (!Number.isFinite(classroomId)) {
			return NextResponse.json({ error: "Turma invalida" }, { status: 400 });
		}

		// Verify access based on role
		let allowed = false;
		if (payload.role === "ADMIN") {
			const rows = await sql`
        SELECT 1 FROM classrooms
        WHERE id = ${classroomId} AND school_id = ${payload.schoolId}
      `;
			allowed = rows.length > 0;
		} else if (payload.role === "PROFESSOR") {
			const rows = await sql`
        SELECT 1 FROM classroom_teachers
        WHERE classroom_id = ${classroomId} AND user_id = ${payload.id}
      `;
			allowed = rows.length > 0;
		} else {
			// ALUNO: only allowed if enrolled in this classroom
			const rows = await sql`
        SELECT 1 FROM classroom_students
        WHERE classroom_id = ${classroomId} AND user_id = ${payload.id}
      `;
			allowed = rows.length > 0;
		}

		if (!allowed) {
			return NextResponse.json(
				{ error: "Turma nao encontrada" },
				{ status: 404 },
			);
		}

		// Fetch classroom name
		const classroomRows = await sql`
      SELECT name FROM classrooms WHERE id = ${classroomId} LIMIT 1
    `;
		const classroomName = classroomRows[0]?.name ?? `Turma ${classroomId}`;

		// Score formula: money/100 + knowledge + happiness + current_day * 10
		const ranking = await sql`
      SELECT
        ROW_NUMBER() OVER (
          ORDER BY (
            COALESCE(gs.money / 100.0, 0) +
            COALESCE(gs.knowledge, 0) +
            COALESCE(gs.happiness, 0) +
            COALESCE(gs.current_day * 10, 0)
          ) DESC NULLS LAST
        )::int AS rank,
        u.id AS user_id,
        u.name,
        ROUND(
          COALESCE(gs.money / 100.0, 0) +
          COALESCE(gs.knowledge, 0) +
          COALESCE(gs.happiness, 0) +
          COALESCE(gs.current_day * 10, 0)
        )::int AS score,
        COALESCE(gs.current_day, 0)::int AS current_day,
        COALESCE(gs.money, 0)::numeric AS money,
        COALESCE(gs.knowledge, 0)::int AS knowledge,
        COALESCE(gs.happiness, 0)::int AS happiness,
        gs.status AS game_status
      FROM classroom_students cs
      INNER JOIN users u ON u.id = cs.user_id
      LEFT JOIN LATERAL (
        SELECT money, knowledge, happiness, current_day, status
        FROM game_sessions
        WHERE user_id = u.id
        ORDER BY updated_at DESC
        LIMIT 1
      ) gs ON true
      WHERE cs.classroom_id = ${classroomId}
      ORDER BY score DESC NULLS LAST
    `;

		return NextResponse.json({ ranking, classroomName });
	} catch (error) {
		console.error("Classroom ranking error:", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
