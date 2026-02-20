import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, createToken } from "@/lib/auth";
import { sql } from "@/lib/db";
import { isSuperAdminEmail } from "@/lib/super-admin";
import type { PlanType } from "@/types/user";

const PLAN_PRICES: Record<PlanType, number> = {
	FREE: 0,
	INDIVIDUAL: 4.99,
	ESCOLAR: 399,
};

export async function PATCH(request: Request) {
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
			return NextResponse.json(
				{ error: "Apenas SUPER ADMIN pode alterar plano" },
				{ status: 403 },
			);
		}

		const body = await request.json();
		const planType = body.planType as PlanType;
		if (!["FREE", "INDIVIDUAL", "ESCOLAR"].includes(planType)) {
			return NextResponse.json({ error: "Plano invalido" }, { status: 400 });
		}

		const updated = (await sql`
      UPDATE users
      SET plan_type = ${planType}, plan_price = ${PLAN_PRICES[planType]}
      WHERE id = ${payload.id}
      RETURNING id, email, name, role, school_id, plan_type
    `) as Array<{
			id: number;
			email: string;
			name: string;
			role: "ADMIN" | "PROFESSOR" | "ALUNO";
			school_id: number | null;
			plan_type: PlanType;
		}>;

		if (updated.length === 0) {
			return NextResponse.json(
				{ error: "Usuario nao encontrado" },
				{ status: 404 },
			);
		}

		const user = updated[0];
		const newToken = await createToken({
			id: user.id,
			email: user.email,
			name: user.name,
			role: user.role,
			schoolId: user.school_id,
			planType: user.plan_type,
		});

		const response = NextResponse.json({
			user: {
				id: user.id,
				email: user.email,
				name: user.name,
				role: user.role,
				schoolId: user.school_id,
				planType: user.plan_type,
			},
		});

		response.cookies.set("token", newToken, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			maxAge: 60 * 60 * 24 * 7,
			path: "/",
		});

		return response;
	} catch (error) {
		console.error("Update own plan error:", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
