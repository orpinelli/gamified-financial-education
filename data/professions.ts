import type { Profession } from "@/types/game";

export const PROFESSIONS: Profession[] = [
  {
    id: "vendedor_ambulante",
    name: "Vendedor Ambulante",
    description:
      "Trabalho simples e imediato. Ganha razoavel desde o inicio, mas dificilmente cresce muito.",
    baseSalary: 1800,
    studyRequirement: "BAIXO",
    growthMultiplier: 1.0,
    type: "IMEDIATO",
    icon: "ShoppingCart",
    minKnowledgeForBonus: 10,
  },
  {
    id: "cabeleireiro",
    name: "Cabeleireiro(a)",
    description:
      "Profissao pratica com clientela fiel. Bom retorno inicial, crescimento moderado.",
    baseSalary: 2200,
    studyRequirement: "BAIXO",
    growthMultiplier: 1.1,
    type: "IMEDIATO",
    icon: "Scissors",
    minKnowledgeForBonus: 15,
  },
  {
    id: "tecnico_ti",
    name: "Tecnico em TI",
    description:
      "Exige estudo medio mas tem demanda alta. Equilibrio entre ganho atual e potencial futuro.",
    baseSalary: 2800,
    studyRequirement: "MEDIO",
    growthMultiplier: 1.5,
    type: "EQUILIBRADO",
    icon: "Monitor",
    minKnowledgeForBonus: 35,
  },
  {
    id: "contador",
    name: "Contador(a)",
    description:
      "Profissao estavel que exige conhecimento tecnico. Bom equilibrio e seguranca financeira.",
    baseSalary: 3200,
    studyRequirement: "MEDIO",
    growthMultiplier: 1.6,
    type: "EQUILIBRADO",
    icon: "Calculator",
    minKnowledgeForBonus: 40,
  },
  {
    id: "enfermeiro",
    name: "Enfermeiro(a)",
    description:
      "Exige dedicacao nos estudos mas oferece estabilidade e crescimento a longo prazo.",
    baseSalary: 3500,
    studyRequirement: "ALTO",
    growthMultiplier: 1.8,
    type: "LONGO_PRAZO",
    icon: "Heart",
    minKnowledgeForBonus: 55,
  },
  {
    id: "engenheiro",
    name: "Engenheiro(a)",
    description:
      "Muito estudo necessario, porem a recompensa financeira e a carreira escalam bastante.",
    baseSalary: 4000,
    studyRequirement: "ALTO",
    growthMultiplier: 2.2,
    type: "LONGO_PRAZO",
    icon: "Wrench",
    minKnowledgeForBonus: 60,
  },
  {
    id: "advogado",
    name: "Advogado(a)",
    description:
      "Exige muito estudo e dedicacao. O retorno cresce significativamente com experiencia.",
    baseSalary: 3800,
    studyRequirement: "MUITO_ALTO",
    growthMultiplier: 2.5,
    type: "LONGO_PRAZO",
    icon: "Scale",
    minKnowledgeForBonus: 70,
  },
  {
    id: "medico",
    name: "Medico(a)",
    description:
      "A profissao mais exigente em estudo, porem com o maior potencial de ganho a longo prazo.",
    baseSalary: 4500,
    studyRequirement: "MUITO_ALTO",
    growthMultiplier: 3.0,
    type: "LONGO_PRAZO",
    icon: "Stethoscope",
    minKnowledgeForBonus: 80,
  },
];

export function getProfessionById(id: string): Profession | undefined {
  return PROFESSIONS.find((p) => p.id === id);
}

export function calculateSalary(profession: Profession, knowledge: number): number {
  const knowledgeRatio = Math.min(knowledge / 100, 1);
  const bonus =
    knowledge >= profession.minKnowledgeForBonus
      ? (profession.growthMultiplier - 1) * knowledgeRatio
      : 0;
  return Math.round(profession.baseSalary * (1 + bonus));
}
