import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { isSuperAdminEmail } from "@/lib/super-admin";
import { sql } from "@/lib/db";

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

		if (payload.planType !== "ESCOLAR") {
			return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
		}

		if (payload.role !== "ADMIN" && payload.role !== "PROFESSOR") {
			return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
		}

		if (!payload.schoolId) {
			return NextResponse.json({ error: "Escola nao encontrada" }, { status: 400 });
		}

		const body = (await request.json()) as { name?: string };
		const name = body.name?.trim();
		if (!name) {
			return NextResponse.json({ error: "Nome da turma e obrigatorio" }, { status: 400 });
		}

		const rows = await sql`
      INSERT INTO classrooms (name, school_id)
      VALUES (${name}, ${payload.schoolId})
      RETURNING id, name
    `;
		const classroom = rows[0] as { id: number; name: string };

		if (payload.role === "PROFESSOR") {
			await sql`
        INSERT INTO classroom_teachers (classroom_id, user_id)
        VALUES (${classroom.id}, ${payload.id})
        ON CONFLICT DO NOTHING
      `;
		}

		return NextResponse.json({ classroom }, { status: 201 });
	} catch (error) {
		console.error("Create classroom error:", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}

export async function GET(request: Request) {
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

		const { searchParams } = new URL(request.url);
		const superAdmin = isSuperAdminEmail(payload.email);
		const requestedSchoolId = searchParams.get("schoolId")
			? Number(searchParams.get("schoolId"))
			: null;

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
			// SUPER_ADMIN can pass ?schoolId=X to see another school's classrooms
			const targetSchoolId =
				superAdmin && requestedSchoolId ? requestedSchoolId : payload.schoolId;
			classrooms = await sql`
        SELECT c.id, c.name,
          COUNT(DISTINCT cs.user_id)::int AS students_count
        FROM classrooms c
        LEFT JOIN classroom_students cs ON cs.classroom_id = c.id
        WHERE c.school_id = ${targetSchoolId}
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
