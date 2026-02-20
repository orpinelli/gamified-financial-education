import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { SessionUser } from "@/types/user";

const JWT_SECRET = new TextEncoder().encode(
	process.env.JWT_SECRET || "default-secret-change-in-production-please",
);

const COOKIE_NAME = "token";

export async function createToken(user: SessionUser): Promise<string> {
	return new SignJWT({
		id: user.id,
		email: user.email,
		name: user.name,
		role: user.role,
		schoolId: user.schoolId,
		planType: user.planType,
	})
		.setProtectedHeader({ alg: "HS256" })
		.setExpirationTime("7d")
		.sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<SessionUser | null> {
	try {
		const { payload } = await jwtVerify(token, JWT_SECRET);
		return {
			id: payload.id as number,
			email: payload.email as string,
			name: payload.name as string,
			role: payload.role as SessionUser["role"],
			schoolId: (payload.schoolId as number | null | undefined) ?? null,
			planType: payload.planType as SessionUser["planType"],
		};
	} catch {
		return null;
	}
}

export async function setSessionCookie(token: string): Promise<void> {
	const cookieStore = await cookies();
	cookieStore.set(COOKIE_NAME, token, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		maxAge: 60 * 60 * 24 * 7,
		path: "/",
	});
}

export async function getSessionCookie(): Promise<string | null> {
	const cookieStore = await cookies();
	return cookieStore.get(COOKIE_NAME)?.value ?? null;
}

export async function clearSessionCookie(): Promise<void> {
	const cookieStore = await cookies();
	cookieStore.delete(COOKIE_NAME);
}

export async function getCurrentUser(): Promise<SessionUser | null> {
	const token = await getSessionCookie();
	if (!token) return null;
	return verifyToken(token);
}

export async function createSessionToken(user: SessionUser): Promise<string> {
	return createToken(user);
}

export async function verifySessionToken(
	token: string,
): Promise<SessionUser | null> {
	return verifyToken(token);
}
