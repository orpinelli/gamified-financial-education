import type { UserRole } from "@/src/shared/types/domain";
import { getRolePermissions } from "@/src/shared/utils/permissions";

export function useCurrentRole(role: UserRole) {
	return {
		role,
		permissions: getRolePermissions(role),
	};
}
