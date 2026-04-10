import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { sql } from "@/lib/db";
import { isSuperAdminEmail } from "@/lib/super-admin";

const PLAN_PRICES: Record<string, number> = {
	FREE: 0,
	INDIVIDUAL: 4.99,
	ESCOLAR: 399.0,
};

export async function PATCH(
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

		if (!isSuperAdminEmail(payload.email)) {
			return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
		}

		const { id } = await params;
		const targetId = Number(id);
		if (!Number.isFinite(targetId)) {
			return NextResponse.json({ error: "ID invalido" }, { status: 400 });
		}

		const body = await request.json();
		const { name, email, role, planType, schoolId } = body as {
			name?: string;
			email?: string;
			role?: string;
			planType?: string;
			schoolId?: number | null;
		};

		// Validate email uniqueness if changing
		if (email) {
			const existing = await sql`
        SELECT id FROM users WHERE email = ${email.toLowerCase().trim()} AND id != ${targetId} LIMIT 1
      `;
			if (existing.length > 0) {
				return NextResponse.json(
					{ error: "Email ja em uso por outro usuario" },
					{ status: 400 },
				);
			}
		}

		if (role && !["ADMIN", "PROFESSOR", "ALUNO"].includes(role)) {
			return NextResponse.json({ error: "Role invalida" }, { status: 400 });
		}

		if (planType && !["FREE", "INDIVIDUAL", "ESCOLAR"].includes(planType)) {
			return NextResponse.json({ error: "Plano invalido" }, { status: 400 });
		}

		if (schoolId !== undefined && schoolId !== null) {
			const school = await sql`SELECT id FROM schools WHERE id = ${schoolId} LIMIT 1`;
			if (school.length === 0) {
				return NextResponse.json(
					{ error: "Escola nao encontrada" },
					{ status: 400 },
				);
			}
		}

		// Fetch current user to merge values
		const current = (await sql`
      SELECT id, name, email, role, plan_type, plan_price, school_id, active
      FROM users WHERE id = ${targetId} LIMIT 1
    `) as Array<{
			id: number;
			name: string;
			email: string;
			role: string;
			plan_type: string;
			plan_price: number;
			school_id: number | null;
			active: boolean;
		}>;

		if (current.length === 0) {
			return NextResponse.json(
				{ error: "Usuario nao encontrado" },
				{ status: 404 },
			);
		}

		const u = current[0];
		const newName = name ?? u.name;
		const newEmail = email ? email.toLowerCase().trim() : u.email;
		const newRole = (role ?? u.role) as "ADMIN" | "PROFESSOR" | "ALUNO";
		const newPlanType = (planType ?? u.plan_type) as
			| "FREE"
			| "INDIVIDUAL"
			| "ESCOLAR";
		const newPlanPrice =
			planType !== undefined ? (PLAN_PRICES[planType] ?? 0) : u.plan_price;
		const newSchoolId =
			schoolId !== undefined ? schoolId : u.school_id;

		const updated = (await sql`
      UPDATE users SET
        name = ${newName},
        email = ${newEmail},
        role = ${newRole},
        plan_type = ${newPlanType},
        plan_price = ${newPlanPrice},
        school_id = ${newSchoolId}
      WHERE id = ${targetId}
      RETURNING id, name, email, role, plan_type, plan_price, school_id, active
    `) as typeof current;

		return NextResponse.json({ user: updated[0] });
	} catch (error) {
		console.error("User full edit error:", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
