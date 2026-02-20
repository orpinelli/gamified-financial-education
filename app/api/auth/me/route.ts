import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

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

		return NextResponse.json({
			user: {
				id: payload.id,
				email: payload.email,
				name: payload.name,
				role: payload.role,
				schoolId: payload.schoolId,
				planType: payload.planType,
			},
		});
	} catch {
		return NextResponse.json({ user: null }, { status: 401 });
	}
}
