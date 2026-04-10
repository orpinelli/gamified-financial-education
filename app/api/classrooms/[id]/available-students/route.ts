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

		if (payload.role !== "ADMIN" && payload.role !== "PROFESSOR") {
			return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
		}

		const { id } = await params;
		const classroomId = Number(id);
		if (!Number.isFinite(classroomId)) {
			return NextResponse.json({ error: "Turma invalida" }, { status: 400 });
		}

		// Determine the school_id for this classroom
		let schoolId: number;
		if (payload.role === "ADMIN") {
			const rows = await sql`
        SELECT school_id FROM classrooms WHERE id = ${classroomId} AND school_id = ${payload.schoolId}
      `;
			if (rows.length === 0) {
				return NextResponse.json({ error: "Turma nao encontrada" }, { status: 404 });
			}
			schoolId = payload.schoolId as number;
		} else {
			const rows = await sql`
        SELECT c.school_id FROM classrooms c
        INNER JOIN classroom_teachers ct ON ct.classroom_id = c.id
        WHERE c.id = ${classroomId} AND ct.user_id = ${payload.id}
      `;
			if (rows.length === 0) {
				return NextResponse.json({ error: "Turma nao encontrada" }, { status: 404 });
			}
			schoolId = (rows[0] as { school_id: number }).school_id;
		}

		const students = await sql`
      SELECT u.id, u.name, u.email
      FROM users u
      WHERE u.school_id = ${schoolId}
        AND u.role = 'ALUNO'
        AND u.active = true
        AND u.id NOT IN (
          SELECT user_id FROM classroom_students WHERE classroom_id = ${classroomId}
        )
      ORDER BY u.name
    `;

		return NextResponse.json({ students });
	} catch (error) {
		console.error("Available students error:", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
