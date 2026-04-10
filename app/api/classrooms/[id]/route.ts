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

		let allowed = false;
		if (payload.role === "ADMIN") {
			const rows = await sql`
        SELECT id
        FROM classrooms
        WHERE id = ${classroomId} AND school_id = ${payload.schoolId}
      `;
			allowed = rows.length > 0;
		} else if (payload.role === "PROFESSOR") {
			const rows = await sql`
        SELECT c.id
        FROM classrooms c
        INNER JOIN classroom_teachers ct ON ct.classroom_id = c.id
        WHERE c.id = ${classroomId} AND ct.user_id = ${payload.id}
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

		const students = await sql`
      SELECT u.id, u.name, u.email,
				COALESCE(progress.completed_lessons, 0)::int AS lessons_watched,
        gs.status AS game_status,
        gs.current_day,
        gs.money,
        gs.knowledge,
        gs.happiness,
        gs.energy
      FROM classroom_students cs
      INNER JOIN users u ON u.id = cs.user_id
      LEFT JOIN LATERAL (
				SELECT COUNT(*) AS completed_lessons
				FROM game_day_logs gdl
				INNER JOIN game_sessions gss ON gss.id = gdl.game_session_id
				WHERE gss.user_id = u.id
			) progress ON true
      LEFT JOIN LATERAL (
        SELECT status, current_day, money, knowledge, happiness, energy
        FROM game_sessions
        WHERE user_id = u.id
        ORDER BY updated_at DESC
        LIMIT 1
      ) gs ON true
      WHERE cs.classroom_id = ${classroomId}
      ORDER BY u.name
    `;

		// ALUNO should not see email addresses of classmates
		const result =
			payload.role === "ALUNO"
				? students.map(({ email: _email, ...s }) => s)
				: students;

		return NextResponse.json({ students: result });
	} catch (error) {
		console.error("Classroom detail error:", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
