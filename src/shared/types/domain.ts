export type UserRole = "ADMIN" | "PROFESSOR" | "ALUNO";

export interface User {
	id: number;
	email: string;
	name: string;
	role: UserRole;
	schoolId: number | null;
	classroomIds: number[];
}

export interface Classroom {
	id: number;
	name: string;
	schoolId: number;
	teacherIds: number[];
	studentIds: number[];
}

export interface Profession {
	id: string;
	name: string;
	baseSalary: number;
	studyRequirement: "BAIXO" | "MEDIO" | "ALTO" | "MUITO_ALTO";
	growthMultiplier: number;
}

export interface GameState {
	userId: number;
	day: number;
	money: number;
	knowledge: number;
	happiness: number;
	energy: number;
	profession: Profession;
}

export interface EventOption {
	id: string;
	label: string;
	description: string;
	diceCount: 0 | 1 | 2;
	successThreshold?: number;
	effects: Partial<Omit<GameState, "userId" | "day" | "profession">>;
	successEffects?: Partial<Omit<GameState, "userId" | "day" | "profession">>;
	failureEffects?: Partial<Omit<GameState, "userId" | "day" | "profession">>;
}

export interface GameEvent {
	id: string;
	title: string;
	description: string;
	options: EventOption[];
}

export interface NotificationItem {
	id: string;
	type: "success" | "error" | "info";
	message: string;
}
