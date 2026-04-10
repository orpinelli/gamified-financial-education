import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { isSuperAdminEmail } from "@/lib/super-admin";
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

		if (payload.role !== "ADMIN") {
			return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
		}

		const { id } = await params;
		const classroomId = Number(id);
		if (!Number.isFinite(classroomId)) {
			return NextResponse.json({ error: "Turma invalida" }, { status: 400 });
		}

		const superAdmin = isSuperAdminEmail(payload.email);

		if (!superAdmin) {
			// Regular ADMIN: verify classroom belongs to their school
			const rows = await sql`
        SELECT 1 FROM classrooms WHERE id = ${classroomId} AND school_id = ${payload.schoolId}
      `;
			if (rows.length === 0) {
				return NextResponse.json({ error: "Turma nao encontrada" }, { status: 404 });
			}
		}

		const members = await sql`
      SELECT user_id FROM classroom_students WHERE classroom_id = ${classroomId}
    `;

		return NextResponse.json({ userIds: members.map((m) => (m as { user_id: number }).user_id) });
	} catch (error) {
		console.error("Classroom members error:", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
