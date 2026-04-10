import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function POST(
	request: Request,
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

		// Verify access
		if (payload.role === "ADMIN") {
			const rows = await sql`
        SELECT 1 FROM classrooms WHERE id = ${classroomId} AND school_id = ${payload.schoolId}
      `;
			if (rows.length === 0) {
				return NextResponse.json({ error: "Turma nao encontrada" }, { status: 404 });
			}
		} else {
			const rows = await sql`
        SELECT 1 FROM classroom_teachers WHERE classroom_id = ${classroomId} AND user_id = ${payload.id}
      `;
			if (rows.length === 0) {
				return NextResponse.json({ error: "Turma nao encontrada" }, { status: 404 });
			}
		}

		const body = (await request.json()) as { userId?: number; fromClassroomId?: number };
		const userId = Number(body.userId);
		if (!Number.isFinite(userId)) {
			return NextResponse.json({ error: "Aluno invalido" }, { status: 400 });
		}

		if (body.fromClassroomId) {
			await sql`
        DELETE FROM classroom_students
        WHERE classroom_id = ${body.fromClassroomId} AND user_id = ${userId}
      `;
		}

		await sql`
      INSERT INTO classroom_students (classroom_id, user_id)
      VALUES (${classroomId}, ${userId})
      ON CONFLICT DO NOTHING
    `;

		return NextResponse.json({ ok: true });
	} catch (error) {
		console.error("Add student to classroom error:", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
