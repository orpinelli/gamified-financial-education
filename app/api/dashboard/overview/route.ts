import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { isSuperAdminEmail } from "@/lib/super-admin";
import { sql } from "@/lib/db";

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

		if (payload.role !== "ADMIN") {
			return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
		}

		const superAdmin = isSuperAdminEmail(payload.email);

		const { searchParams } = new URL(request.url);
		const filterSchoolId = superAdmin && searchParams.get("schoolId")
			? Number(searchParams.get("schoolId"))
			: null;
		const filterClassroomId = searchParams.get("classroomId")
			? Number(searchParams.get("classroomId"))
			: null;

		// Effective school filter: SUPER_ADMIN uses filterSchoolId; ADMIN always uses their own school
		const effectiveSchoolId = superAdmin ? filterSchoolId : payload.schoolId;

		// SUPER_ADMIN sees everything; regular ADMIN sees only their school
		const [schools, users, planStats] = await Promise.all([
			superAdmin
				? sql`
          SELECT s.id, s.name, s.plan_type, s.plan_price, s.created_at,
            COUNT(u.id)::int AS user_count
          FROM schools s
          LEFT JOIN users u ON u.school_id = s.id
          GROUP BY s.id
          ORDER BY s.created_at DESC
        `
				: sql`
          SELECT s.id, s.name, s.plan_type, s.plan_price, s.created_at,
            COUNT(u.id)::int AS user_count
          FROM schools s
          LEFT JOIN users u ON u.school_id = s.id
          WHERE s.id = ${payload.schoolId}
          GROUP BY s.id
          ORDER BY s.created_at DESC
        `,
			// Users query with optional school + classroom filters
			effectiveSchoolId && filterClassroomId
				? sql`
          SELECT u.id, u.name, u.email, u.role, u.plan_type, u.plan_price,
                 u.school_id, u.created_at, u.active,
            s.name AS school_name
          FROM users u
          LEFT JOIN schools s ON s.id = u.school_id
          INNER JOIN classroom_students cs ON cs.user_id = u.id AND cs.classroom_id = ${filterClassroomId}
          WHERE u.school_id = ${effectiveSchoolId}
          ORDER BY u.role, u.name
        `
				: effectiveSchoolId
					? sql`
          SELECT u.id, u.name, u.email, u.role, u.plan_type, u.plan_price,
                 u.school_id, u.created_at, u.active,
            s.name AS school_name
          FROM users u
          LEFT JOIN schools s ON s.id = u.school_id
          WHERE u.school_id = ${effectiveSchoolId}
          ORDER BY u.role, u.name
        `
					: filterClassroomId
						? sql`
          SELECT u.id, u.name, u.email, u.role, u.plan_type, u.plan_price,
                 u.school_id, u.created_at, u.active,
            s.name AS school_name
          FROM users u
          LEFT JOIN schools s ON s.id = u.school_id
          INNER JOIN classroom_students cs ON cs.user_id = u.id AND cs.classroom_id = ${filterClassroomId}
          ORDER BY u.role, u.name
        `
						: sql`
          SELECT u.id, u.name, u.email, u.role, u.plan_type, u.plan_price,
                 u.school_id, u.created_at, u.active,
            s.name AS school_name
          FROM users u
          LEFT JOIN schools s ON s.id = u.school_id
          ORDER BY u.created_at DESC
        `,
			superAdmin
				? sql`
          SELECT
            plan_type,
            COUNT(*)::int AS total_users,
            COALESCE(SUM(plan_price), 0)::numeric(12, 2) AS monthly_revenue
          FROM users
          GROUP BY plan_type
        `
				: sql`
          SELECT
            plan_type,
            COUNT(*)::int AS total_users,
            COALESCE(SUM(plan_price), 0)::numeric(12, 2) AS monthly_revenue
          FROM users
          WHERE school_id = ${payload.schoolId}
          GROUP BY plan_type
        `,
		]);

		const typedPlanStats = planStats as unknown as Array<{
			plan_type: "FREE" | "INDIVIDUAL" | "ESCOLAR";
			total_users: number;
			monthly_revenue: number | string;
		}>;

		const totals = {
			schools: Number(schools.length),
			users: Number(users.length),
			revenue: Number(
				typedPlanStats.reduce(
					(acc, row) => acc + Number(row.monthly_revenue),
					0,
				),
			),
		};

		return NextResponse.json({
			schools,
			users,
			planStats: typedPlanStats,
			totals,
		});
	} catch (error) {
		console.error("Dashboard overview error:", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
