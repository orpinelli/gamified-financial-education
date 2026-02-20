export type UserRole = "ADMIN" | "PROFESSOR" | "ALUNO";
export type PlanType = "FREE" | "INDIVIDUAL" | "ESCOLAR";

export interface User {
	id: number;
	email: string;
	name: string;
	role: UserRole;
	school_id: number | null;
	plan_type: PlanType;
	plan_price: number;
	created_at: string;
}

export interface SessionUser {
	id: number;
	email: string;
	name: string;
	role: UserRole;
	schoolId: number | null;
	planType: PlanType;
}

export interface AuthUser {
	id: number;
	email: string;
	name: string;
	role: UserRole;
	schoolId: number | null;
	planType: PlanType;
}

export interface Classroom {
	id: number;
	name: string;
	school_id: number | null;
	created_at: string;
}

export interface ClassroomWithStudents extends Classroom {
	students: StudentSummary[];
}

export interface StudentSummary {
	id: number;
	name: string;
	email: string;
	game_session: GameSessionSummary | null;
}

export interface GameSessionSummary {
	id: number;
	character_name: string;
	profession_id: string;
	current_day: number;
	money: number;
	knowledge: number;
	happiness: number;
	energy: number;
	health: number;
	status: "ACTIVE" | "COMPLETED";
}
