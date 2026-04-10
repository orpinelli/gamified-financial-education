import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { isSuperAdminEmail } from "@/lib/super-admin";
import { sql } from "@/lib/db";

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
		if (!payload || payload.role !== "ADMIN") {
			return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
		}

		const { id } = await params;
		const targetId = Number(id);
		if (!Number.isFinite(targetId)) {
			return NextResponse.json({ error: "ID invalido" }, { status: 400 });
		}

		const body = await request.json();
		if (typeof body.active !== "boolean") {
			return NextResponse.json(
				{ error: "Campo 'active' obrigatorio (boolean)" },
				{ status: 400 },
			);
		}

		const superAdmin = isSuperAdminEmail(payload.email);

		// Fetch target user to validate permissions
		const targets = (await sql`
      SELECT id, role, school_id, active FROM users WHERE id = ${targetId} LIMIT 1
    `) as Array<{
			id: number;
			role: "ADMIN" | "PROFESSOR" | "ALUNO";
			school_id: number | null;
			active: boolean;
		}>;

		if (targets.length === 0) {
			return NextResponse.json(
				{ error: "Usuario nao encontrado" },
				{ status: 404 },
			);
		}

		const target = targets[0];

		if (!superAdmin) {
			// Regular ADMIN: can only manage users in their school, cannot deactivate other ADMINs
			if (target.school_id !== payload.schoolId) {
				return NextResponse.json(
					{ error: "Usuario nao encontrado" },
					{ status: 404 },
				);
			}
			if (target.role === "ADMIN" && !body.active) {
				return NextResponse.json(
					{ error: "Nao e possivel desativar outro administrador" },
					{ status: 403 },
				);
			}
		}

		const updated = (await sql`
      UPDATE users SET active = ${body.active}
      WHERE id = ${targetId}
      RETURNING id, name, email, role, active
    `) as Array<{
			id: number;
			name: string;
			email: string;
			role: string;
			active: boolean;
		}>;

		return NextResponse.json({ user: updated[0] });
	} catch (error) {
		console.error("User status update error:", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
