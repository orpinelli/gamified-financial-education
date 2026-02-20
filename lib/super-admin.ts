const SUPER_ADMIN_EMAILS = (process.env.SUPER_ADMIN_EMAILS ?? "")
	.split(",")
	.map((email) => email.trim().toLowerCase())
	.filter(Boolean);

export function isSuperAdminEmail(email: string): boolean {
	return SUPER_ADMIN_EMAILS.includes(email.trim().toLowerCase());
}
