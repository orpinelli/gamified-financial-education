import { PROFESSIONS } from "@/data/professions";
import type { Profession } from "@/src/shared/types/domain";

export const INITIAL_PROFESSIONS: Profession[] = PROFESSIONS.map(
	(profession) => ({
		id: profession.id,
		name: profession.name,
		baseSalary: profession.baseSalary,
		studyRequirement: profession.studyRequirement,
		growthMultiplier: profession.growthMultiplier,
	}),
);
