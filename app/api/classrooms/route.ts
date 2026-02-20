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

		if (payload.planType !== "ESCOLAR") {
			return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
		}

		if (payload.role === "ALUNO") {
			return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
		}

		let classrooms: Array<Record<string, unknown>> = [];

		if (payload.role === "PROFESSOR") {
			classrooms = await sql`
        SELECT c.id, c.name,
          COUNT(DISTINCT cs.user_id)::int AS students_count
        FROM classrooms c
        INNER JOIN classroom_teachers ct ON ct.classroom_id = c.id
        LEFT JOIN classroom_students cs ON cs.classroom_id = c.id
        WHERE ct.user_id = ${payload.id}
        GROUP BY c.id, c.name
        ORDER BY c.name
      `;
		}

		if (payload.role === "ADMIN") {
			classrooms = await sql`
        SELECT c.id, c.name,
          COUNT(DISTINCT cs.user_id)::int AS students_count
        FROM classrooms c
        LEFT JOIN classroom_students cs ON cs.classroom_id = c.id
        WHERE c.school_id = ${payload.schoolId}
        GROUP BY c.id, c.name
        ORDER BY c.name
      `;
		}

		return NextResponse.json({ classrooms });
	} catch (error) {
		console.error("List classrooms error:", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
