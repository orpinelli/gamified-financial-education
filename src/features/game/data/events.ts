import type { GameEvent } from "@/src/shared/types/domain";

export const INITIAL_GAME_EVENTS: GameEvent[] = [
	{
		id: "trabalho-extra",
		title: "Hora extra no trabalho",
		description:
			"Seu gestor ofereceu horas extras. Você pode aceitar para ganhar mais, mas ficará mais cansado.",
		options: [
			{
				id: "aceitar-hora-extra",
				label: "Aceitar hora extra",
				description: "Rolar 1 dado para ver seu desempenho.",
				diceCount: 1,
				successThreshold: 4,
				effects: { energy: -8 },
				successEffects: { money: 80, happiness: 2 },
				failureEffects: { money: 30, happiness: -4 },
			},
			{
				id: "recusar-hora-extra",
				label: "Recusar e descansar",
				description: "Menos dinheiro hoje, mas mais energia.",
				diceCount: 0,
				effects: { money: 10, energy: 6, happiness: 4 },
			},
		],
	},
	{
		id: "curso-online",
		title: "Curso rápido de finanças",
		description:
			"Apareceu um curso online de curta duração sobre investimentos básicos.",
		options: [
			{
				id: "fazer-curso",
				label: "Fazer o curso",
				description: "Rolar 2 dados para medir aproveitamento.",
				diceCount: 2,
				successThreshold: 7,
				effects: { energy: -6 },
				successEffects: { knowledge: 12, money: -20 },
				failureEffects: { knowledge: 5, money: -20, happiness: -2 },
			},
			{
				id: "nao-fazer-curso",
				label: "Pular por hoje",
				description: "Sem custo, mas sem aprendizado.",
				diceCount: 0,
				effects: { happiness: 1 },
			},
		],
	},
	{
		id: "convite-lazer",
		title: "Convite de lazer",
		description:
			"Amigos chamaram para um passeio no fim do dia. Isso pode melhorar seu humor.",
		options: [
			{
				id: "aceitar-lazer",
				label: "Aceitar convite",
				description: "Gasta um pouco, mas recupera felicidade.",
				diceCount: 0,
				effects: { money: -35, happiness: 10, energy: 4 },
			},
			{
				id: "ficar-em-casa",
				label: "Ficar em casa e estudar",
				description: "Rolar 1 dado para ganho de conhecimento.",
				diceCount: 1,
				successThreshold: 4,
				effects: { happiness: -2 },
				successEffects: { knowledge: 8 },
				failureEffects: { knowledge: 3, energy: -2 },
			},
		],
	},
];
