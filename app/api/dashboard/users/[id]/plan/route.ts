import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { sql } from "@/lib/db";
import type { PlanType } from "@/types/user";

const PLAN_PRICES: Record<PlanType, number> = {
	FREE: 0,
	INDIVIDUAL: 4.99,
	ESCOLAR: 399,
};

interface RouteContext {
	params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
	try {
		const cookieStore = await cookies();
		const token = cookieStore.get("token")?.value;

		if (!token) {
			return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
		}

		const payload = await verifyToken(token);
		if (!payload || payload.role !== "ADMIN") {
			return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
		}

		const { id } = await context.params;
		const userId = Number(id);

		if (Number.isNaN(userId)) {
			return NextResponse.json(
				{ error: "ID de usuario invalido" },
				{ status: 400 },
			);
		}

		const body = (await request.json()) as { planType?: PlanType };
		const planType = body.planType;

		if (!planType || !Object.keys(PLAN_PRICES).includes(planType)) {
			return NextResponse.json({ error: "Plano invalido" }, { status: 400 });
		}

		const updated = await sql`
      UPDATE users
      SET plan_type = ${planType},
          plan_price = ${PLAN_PRICES[planType]}
      WHERE id = ${userId}
      RETURNING id, name, email, role, plan_type, plan_price, school_id
    `;

		if (updated.length === 0) {
			return NextResponse.json(
				{ error: "Usuario nao encontrado" },
				{ status: 404 },
			);
		}

		return NextResponse.json({ user: updated[0] });
	} catch (error) {
		console.error("Update user plan error:", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
