import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createToken, verifyToken } from "@/lib/auth";
import { sql } from "@/lib/db";

async function normalizeRole(
	userId: number,
	role: "ADMIN" | "PROFESSOR" | "ALUNO",
	schoolId: number | null,
): Promise<"ADMIN" | "PROFESSOR" | "ALUNO"> {
	if (role !== "ALUNO") {
		return role;
	}

	if (!schoolId) {
		return "PROFESSOR";
	}

	const memberships = (await sql`
    SELECT COUNT(*)::int AS total
    FROM classroom_students
    WHERE user_id = ${userId}
  `) as Array<{ total: number }>;

	if ((memberships[0]?.total ?? 0) === 0) {
		return "PROFESSOR";
	}

	return role;
}

export async function GET() {
	try {
		const cookieStore = await cookies();
		const token = cookieStore.get("token")?.value;

		if (!token) {
			return NextResponse.json({ user: null }, { status: 401 });
		}

		const payload = await verifyToken(token);
		if (!payload) {
			return NextResponse.json({ user: null }, { status: 401 });
		}

		const normalizedRole = await normalizeRole(
			payload.id,
			payload.role,
			payload.schoolId,
		);

		const response = NextResponse.json({
			user: {
				id: payload.id,
				email: payload.email,
				name: payload.name,
				role: normalizedRole,
				schoolId: payload.schoolId,
				planType: payload.planType,
			},
		});

		if (normalizedRole !== payload.role) {
			const renewedToken = await createToken({
				id: payload.id,
				email: payload.email,
				name: payload.name,
				role: normalizedRole,
				schoolId: payload.schoolId,
				planType: payload.planType,
			});

			response.cookies.set("token", renewedToken, {
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
				sameSite: "lax",
				maxAge: 60 * 60 * 24 * 7,
				path: "/",
			});
		}

		return response;
	} catch {
		return NextResponse.json({ user: null }, { status: 401 });
	}
}
