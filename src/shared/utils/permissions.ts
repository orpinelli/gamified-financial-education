import type { UserRole, User } from "@/src/shared/types/domain";

export interface PermissionSnapshot {
	canPlayOwnGame: boolean;
	canViewClassroomStudents: boolean;
	canViewAllUsers: boolean;
	canManagePlans: boolean;
}

export function getRolePermissions(role: UserRole): PermissionSnapshot {
	if (role === "ADMIN") {
		return {
			canPlayOwnGame: true,
			canViewClassroomStudents: true,
			canViewAllUsers: true,
			canManagePlans: true,
		};
	}

	if (role === "PROFESSOR") {
		return {
			canPlayOwnGame: true,
			canViewClassroomStudents: true,
			canViewAllUsers: false,
			canManagePlans: false,
		};
	}

	return {
		canPlayOwnGame: true,
		canViewClassroomStudents: false,
		canViewAllUsers: false,
		canManagePlans: false,
	};
}

export function canProfessorSeeStudent(
	professor: User,
	studentId: number,
	classroomStudents: Array<{ classroomId: number; studentId: number }>,
): boolean {
	if (professor.role !== "PROFESSOR") {
		return false;
	}

	return classroomStudents.some(
		(row) =>
			professor.classroomIds.includes(row.classroomId) &&
			row.studentId === studentId,
	);
}
