import type { ReactNode } from "react";
import type { UserRole } from "@/src/shared/types/domain";
import { getRolePermissions } from "@/src/shared/utils/permissions";

interface AuthGateProps {
	role: UserRole;
	children: ReactNode;
}

export function AuthGate({ role, children }: AuthGateProps) {
	const permissions = getRolePermissions(role);

	if (!permissions.canPlayOwnGame) {
		return null;
	}

	return <>{children}</>;
}
