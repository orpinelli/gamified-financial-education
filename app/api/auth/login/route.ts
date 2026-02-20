import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { sql } from "@/lib/db";
import { createToken } from "@/lib/auth";

export async function POST(request: Request) {
	try {
		const { email, password } = await request.json();

		if (!email || !password) {
			return NextResponse.json(
				{ error: "Email e senha sao obrigatorios" },
				{ status: 400 },
			);
		}

		const users = await sql`
      SELECT id, email, password_hash, name, role, school_id, plan_type
      FROM users
      WHERE email = ${email.toLowerCase().trim()}
    `;

		if (users.length === 0) {
			return NextResponse.json(
				{ error: "Email ou senha incorretos" },
				{ status: 401 },
			);
		}

		const user = users[0];
		const validPassword = await bcrypt.compare(password, user.password_hash);

		if (!validPassword) {
			return NextResponse.json(
				{ error: "Email ou senha incorretos" },
				{ status: 401 },
			);
		}

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
			maxAge: 60 * 60 * 24 * 7, // 7 days
			path: "/",
		});

		return response;
	} catch (error) {
		console.error("Login error:", error);

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
