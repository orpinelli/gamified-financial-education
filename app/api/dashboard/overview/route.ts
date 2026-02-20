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

		if (payload.role !== "ADMIN") {
			return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
		}

		const [schools, users, planStats] = await Promise.all([
			sql`
        SELECT s.id, s.name, s.plan_type, s.plan_price, s.created_at,
          COUNT(u.id) AS user_count
        FROM schools s
        LEFT JOIN users u ON u.school_id = s.id
        GROUP BY s.id
        ORDER BY s.created_at DESC
      `,
			sql`
        SELECT u.id, u.name, u.email, u.role, u.plan_type, u.plan_price, u.school_id, u.created_at,
          s.name AS school_name
        FROM users u
        LEFT JOIN schools s ON s.id = u.school_id
        ORDER BY u.created_at DESC
      `,
			sql`
        SELECT
          plan_type,
          COUNT(*)::int AS total_users,
          COALESCE(SUM(plan_price), 0)::numeric(12, 2) AS monthly_revenue
        FROM users
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
