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

		const users = (await sql`
      SELECT id, email, name, role, school_id, plan_type
      FROM users
      WHERE id = ${payload.id}
      LIMIT 1
    `) as Array<{
			id: number;
			email: string;
			name: string;
			role: "ADMIN" | "PROFESSOR" | "ALUNO";
			school_id: number | null;
			plan_type: "FREE" | "INDIVIDUAL" | "ESCOLAR";
		}>;

		const currentUser = users[0];
		if (!currentUser) {
			return NextResponse.json(
				{ error: "Usuario nao encontrado" },
				{ status: 404 },
			);
		}

		const games = await sql`
      SELECT id, character_name, profession_id, current_day, status, updated_at
      FROM game_sessions
      WHERE user_id = ${payload.id}
      ORDER BY updated_at DESC
      LIMIT 20
    `;

		let classrooms: Array<Record<string, unknown>> = [];
		let adminStats: Record<string, number> | null = null;
		let adminUsers: Array<Record<string, unknown>> = [];
		let invites: Array<Record<string, unknown>> = [];

		const isSchoolStaff =
			currentUser.plan_type === "ESCOLAR" &&
			(currentUser.role === "ADMIN" || currentUser.role === "PROFESSOR") &&
			Boolean(currentUser.school_id);

		// ALUNO: return classrooms they are enrolled in (for ranking links)
		if (
			currentUser.role === "ALUNO" &&
			currentUser.plan_type === "ESCOLAR" &&
			currentUser.school_id
		) {
			classrooms = await sql`
        SELECT c.id, c.name,
          COUNT(DISTINCT cs2.user_id)::int AS students_count
        FROM classroom_students cs
        INNER JOIN classrooms c ON c.id = cs.classroom_id
        LEFT JOIN classroom_students cs2 ON cs2.classroom_id = c.id
        WHERE cs.user_id = ${currentUser.id}
        GROUP BY c.id, c.name
        ORDER BY c.name
      `;
		}

		if (isSchoolStaff && currentUser.role === "PROFESSOR") {
			classrooms = await sql`
        SELECT c.id, c.name,
          COUNT(DISTINCT cs.user_id) AS students_count
        FROM classrooms c
        INNER JOIN classroom_teachers ct ON ct.classroom_id = c.id
        LEFT JOIN classroom_students cs ON cs.classroom_id = c.id
        WHERE ct.user_id = ${currentUser.id}
        GROUP BY c.id, c.name
        ORDER BY c.name
      `;
		}

		if (
			isSchoolStaff &&
			currentUser.role === "ADMIN" &&
			currentUser.school_id
		) {
			classrooms = await sql`
        SELECT c.id, c.name,
          COUNT(DISTINCT cs.user_id) AS students_count
        FROM classrooms c
        LEFT JOIN classroom_students cs ON cs.classroom_id = c.id
        WHERE c.school_id = ${currentUser.school_id}
        GROUP BY c.id, c.name
        ORDER BY c.name
      `;

			const stats = (await sql`
        SELECT
          COUNT(*) FILTER (WHERE role = 'PROFESSOR')::int AS professors,
          COUNT(*) FILTER (WHERE role = 'ALUNO')::int AS students,
          COUNT(*)::int AS users
        FROM users
        WHERE school_id = ${currentUser.school_id}
      `) as Array<{ professors: number; students: number; users: number }>;

			adminStats = {
				professors: Number(stats[0]?.professors ?? 0),
				students: Number(stats[0]?.students ?? 0),
				users: Number(stats[0]?.users ?? 0),
				classrooms: classrooms.length,
			};

			adminUsers = await sql`
        SELECT id, name, email, role
        FROM users
        WHERE school_id = ${currentUser.school_id}
        ORDER BY role, name
      `;
		}

		if (isSchoolStaff && currentUser.school_id) {
			try {
				invites = await sql`
        SELECT id, code, target_role, expires_at, active, uses_count, max_uses, created_at
        FROM school_invites
        WHERE school_id = ${currentUser.school_id}
        ORDER BY created_at DESC
        LIMIT 10
      `;
			} catch {
				invites = [];
			}
		}

		return NextResponse.json({
			user: {
				id: currentUser.id,
				email: currentUser.email,
				name: currentUser.name,
				role: currentUser.role,
				schoolId: currentUser.school_id,
				planType: currentUser.plan_type,
			},
			games,
			classrooms,
			invites,
			adminStats,
			adminUsers,
		});
	} catch (error) {
		console.error("Home data error:", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
