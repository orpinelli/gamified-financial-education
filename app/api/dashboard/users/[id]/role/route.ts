import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { isSuperAdminEmail } from "@/lib/super-admin";
import { sql } from "@/lib/db";

const VALID_ROLES = ["ADMIN", "PROFESSOR", "ALUNO"] as const;
type ValidRole = (typeof VALID_ROLES)[number];

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
		if (!VALID_ROLES.includes(body.role)) {
			return NextResponse.json({ error: "Role invalida" }, { status: 400 });
		}

		const newRole = body.role as ValidRole;
		const superAdmin = isSuperAdminEmail(payload.email);

		// Fetch target user
		const targets = (await sql`
      SELECT id, role, school_id FROM users WHERE id = ${targetId} LIMIT 1
    `) as Array<{
			id: number;
			role: "ADMIN" | "PROFESSOR" | "ALUNO";
			school_id: number | null;
		}>;

		if (targets.length === 0) {
			return NextResponse.json(
				{ error: "Usuario nao encontrado" },
				{ status: 404 },
			);
		}

		const target = targets[0];

		if (!superAdmin) {
			// Regular ADMIN: only within their school
			if (target.school_id !== payload.schoolId) {
				return NextResponse.json(
					{ error: "Usuario nao encontrado" },
					{ status: 404 },
				);
			}
			// Protect against demoting the last ADMIN in the school
			if (target.role === "ADMIN" && newRole !== "ADMIN") {
				const adminCount = (await sql`
          SELECT COUNT(*)::int AS total FROM users
          WHERE school_id = ${payload.schoolId} AND role = 'ADMIN'
        `) as Array<{ total: number }>;

				if ((adminCount[0]?.total ?? 0) <= 1) {
					return NextResponse.json(
						{ error: "Nao e possivel remover o unico administrador da escola" },
						{ status: 403 },
					);
				}
			}
		}

		const updated = (await sql`
      UPDATE users SET role = ${newRole}
      WHERE id = ${targetId}
      RETURNING id, name, email, role
    `) as Array<{ id: number; name: string; email: string; role: string }>;

		return NextResponse.json({ user: updated[0] });
	} catch (error) {
		console.error("User role update error:", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
