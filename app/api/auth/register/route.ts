import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { sql } from "@/lib/db";
import { createToken } from "@/lib/auth";
import type { PlanType } from "@/types/user";

const PLAN_PRICES: Record<PlanType, number> = {
	FREE: 0,
	INDIVIDUAL: 4.99,
	ESCOLAR: 399,
};

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const name = String(body.name || "").trim();
		const email = String(body.email || "")
			.toLowerCase()
			.trim();
		const password = String(body.password || "");
		const selectedPlan = (body.planType as PlanType | undefined) ?? "FREE";
		const schoolName = String(body.schoolName || "").trim();
		const inviteCode = String(body.inviteCode || "")
			.trim()
			.toUpperCase();

		if (!name || !email || !password) {
			return NextResponse.json(
				{ error: "Nome, email e senha sao obrigatorios" },
				{ status: 400 },
			);
		}

		if (password.length < 6) {
			return NextResponse.json(
				{ error: "A senha precisa ter pelo menos 6 caracteres" },
				{ status: 400 },
			);
		}

		const validPlans: PlanType[] = ["FREE", "INDIVIDUAL", "ESCOLAR"];
		if (!validPlans.includes(selectedPlan)) {
			return NextResponse.json({ error: "Plano invalido" }, { status: 400 });
		}

		if (selectedPlan === "ESCOLAR" && !schoolName && !inviteCode) {
			return NextResponse.json(
				{ error: "Informe o nome da escola para o plano escolar" },
				{ status: 400 },
			);
		}

		const existing = (await sql`
      SELECT id FROM users WHERE email = ${email}
		`) as Array<{ id: number }>;

		if (existing.length > 0) {
			return NextResponse.json(
				{ error: "Ja existe uma conta com este email" },
				{ status: 409 },
			);
		}

		let schoolId: number | null = null;
		let role: "ADMIN" | "PROFESSOR" | "ALUNO" = "PROFESSOR";

		if (inviteCode) {
			const invites = (await sql`
        SELECT id, school_id, target_role, active, expires_at, uses_count, max_uses
        FROM school_invites
        WHERE code = ${inviteCode}
        LIMIT 1
      `) as Array<{
				id: number;
				school_id: number;
				target_role: "PROFESSOR" | "ALUNO" | "ADMIN";
				active: boolean;
				expires_at: string | null;
				uses_count: number;
				max_uses: number;
			}>;

			const invite = invites[0];
			if (!invite || !invite.active) {
				return NextResponse.json(
					{ error: "Codigo de convite invalido" },
					{ status: 400 },
				);
			}

			if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
				return NextResponse.json(
					{ error: "Convite expirado" },
					{ status: 400 },
				);
			}

			if (invite.uses_count >= invite.max_uses) {
				return NextResponse.json(
					{ error: "Convite sem usos restantes" },
					{ status: 400 },
				);
			}

			schoolId = invite.school_id;
			role = invite.target_role === "PROFESSOR" ? "PROFESSOR" : "ALUNO";

			await sql`
        UPDATE school_invites
        SET uses_count = uses_count + 1,
            active = CASE WHEN uses_count + 1 >= max_uses THEN FALSE ELSE active END
        WHERE id = ${invite.id}
      `;
		} else if (selectedPlan === "ESCOLAR") {
			const createdSchool = (await sql`
        INSERT INTO schools (name, plan_type, plan_price)
        VALUES (${schoolName}, ${selectedPlan}, ${PLAN_PRICES[selectedPlan]})
        RETURNING id
			`) as Array<{ id: number }>;
			schoolId = createdSchool[0].id;
			role = "ADMIN";
		}

		const passwordHash = await bcrypt.hash(password, 10);

		const createdUsers = (await sql`
      INSERT INTO users (email, password_hash, name, role, school_id, plan_type, plan_price)
      VALUES (${email}, ${passwordHash}, ${name}, ${role}, ${schoolId}, ${selectedPlan}, ${PLAN_PRICES[selectedPlan]})
      RETURNING id, email, name, role, school_id, plan_type
    `) as Array<{
			id: number;
			email: string;
			name: string;
			role: "ADMIN" | "PROFESSOR" | "ALUNO";
			school_id: number | null;
			plan_type: PlanType;
		}>;

		const user = createdUsers[0];

		const token = await createToken({
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

		response.cookies.set("token", token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			maxAge: 60 * 60 * 24 * 7,
			path: "/",
		});

		return response;
	} catch (error) {
		console.error("Register error:", error);

		const message = error instanceof Error ? error.message : "";
		if (message.includes("DATABASE_URL is not set")) {
			return NextResponse.json(
				{ error: "DATABASE_URL nao configurada no ambiente" },
				{ status: 503 },
			);
		}

		if (message.includes("DATABASE_URL is using placeholder values")) {
			return NextResponse.json(
				{ error: "DATABASE_URL ainda esta com valores de exemplo" },
				{ status: 503 },
			);
		}

		if (message.includes("column") && message.includes("plan_type")) {
			return NextResponse.json(
				{ error: "Banco desatualizado: rode a migracao de planos" },
				{ status: 500 },
			);
		}

		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
