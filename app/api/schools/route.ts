import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { isSuperAdminEmail } from "@/lib/super-admin";
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

		const superAdmin = isSuperAdminEmail(payload.email);

		const schools = superAdmin
			? await sql`SELECT id, name FROM schools ORDER BY name`
			: await sql`SELECT id, name FROM schools WHERE id = ${payload.schoolId} ORDER BY name`;

		return NextResponse.json({ schools });
	} catch (error) {
		console.error("List schools error:", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
