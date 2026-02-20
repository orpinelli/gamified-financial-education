import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { sql } from "@/lib/db";

// GET - Retrieve students and their game status (for professors and admins)
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

		if (payload.role === "ALUNO") {
			return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
		}

		let students: Array<Record<string, unknown>>;

		if (payload.role === "ADMIN") {
			// Admin sees all students in the school
			students = await sql`
        SELECT u.id, u.name, u.email,
          gs.id as session_id, gs.character_name, gs.profession_id,
          gs.current_day, gs.money, gs.knowledge, gs.happiness,
          gs.energy, gs.health, gs.status as game_status,
          c.name as classroom_name
        FROM users u
        LEFT JOIN game_sessions gs ON gs.user_id = u.id AND gs.status = 'ACTIVE'
        LEFT JOIN classroom_students cs ON cs.user_id = u.id
        LEFT JOIN classrooms c ON c.id = cs.classroom_id
        WHERE u.role = 'ALUNO' AND u.school_id = ${payload.schoolId}
        ORDER BY c.name, u.name
      `;
		} else {
			// Professor sees only their classroom students
			students = await sql`
        SELECT u.id, u.name, u.email,
          gs.id as session_id, gs.character_name, gs.profession_id,
          gs.current_day, gs.money, gs.knowledge, gs.happiness,
          gs.energy, gs.health, gs.status as game_status,
          c.name as classroom_name
        FROM users u
        INNER JOIN classroom_students cs ON cs.user_id = u.id
        INNER JOIN classrooms c ON c.id = cs.classroom_id
        INNER JOIN classroom_teachers ct ON ct.classroom_id = c.id
        LEFT JOIN game_sessions gs ON gs.user_id = u.id AND gs.status = 'ACTIVE'
        WHERE ct.user_id = ${payload.id}
        ORDER BY c.name, u.name
      `;
		}

		return NextResponse.json({ students });
	} catch (error) {
		console.error("Dashboard students error:", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
