// Shared monthly choices data — used by frontend (MonthlyChoicesModal) and backend (advance/route)

export type ChoiceLevel = "economico" | "equilibrado" | "premium";

export type ChoiceOption = {
	level: ChoiceLevel;
	levelEmoji: string;
	label: string;
	description: string;
	note?: string;
	money: number; // monthly cost (negative = expense)
	happiness: number; // 😊 effect at start of month
};

export type ChoiceCard = {
	key: string;
	emoji: string;
	cardNumber: number;
	title: string;
	prompt: string;
	options: ChoiceOption[];
};

export const MONTHLY_CHOICE_CARDS: ChoiceCard[] = [
	{
		key: "moradia",
		emoji: "🏠",
		cardNumber: 1,
		title: "Onde morar",
		prompt: "Chegou o início do mês. Você precisa decidir onde vai morar.",
		options: [
			{
				level: "economico",
				levelEmoji: "💸",
				label: "Econômico",
				description: "Divide casa / mora longe",
				money: -500,
				happiness: -2,
			},
			{
				level: "equilibrado",
				levelEmoji: "⚖️",
				label: "Equilibrado",
				description: "Apartamento simples bem localizado",
				money: -900,
				happiness: 1,
			},
			{
				level: "premium",
				levelEmoji: "💎",
				label: "Premium",
				description: "Alto padrão em bairro nobre",
				money: -1800,
				happiness: 4,
			},
		],
	},
	{
		key: "alimentacao",
		emoji: "🍔",
		cardNumber: 2,
		title: "Alimentação",
		prompt: "Como será sua alimentação esse mês?",
		options: [
			{
				level: "economico",
				levelEmoji: "💸",
				label: "Econômico",
				description: "Cozinhar sempre em casa",
				money: -400,
				happiness: -1,
			},
			{
				level: "equilibrado",
				levelEmoji: "⚖️",
				label: "Equilibrado",
				description: "Cozinha + sair às vezes",
				money: -700,
				happiness: 2,
			},
			{
				level: "premium",
				levelEmoji: "💎",
				label: "Premium",
				description: "Delivery e restaurantes",
				money: -1200,
				happiness: 4,
			},
		],
	},
	{
		key: "transporte",
		emoji: "🚗",
		cardNumber: 3,
		title: "Transporte",
		prompt: "Como você vai se locomover?",
		options: [
			{
				level: "economico",
				levelEmoji: "💸",
				label: "Econômico",
				description: "Transporte público",
				money: -200,
				happiness: -1,
			},
			{
				level: "equilibrado",
				levelEmoji: "⚖️",
				label: "Equilibrado",
				description: "Carro econômico / apps de viagem",
				money: -600,
				happiness: 1,
			},
			{
				level: "premium",
				levelEmoji: "💎",
				label: "Premium",
				description: "Carro confortável / apps frequentes",
				money: -1200,
				happiness: 3,
			},
		],
	},
	{
		key: "entretenimento",
		emoji: "🎬",
		cardNumber: 4,
		title: "Entretenimento",
		prompt: "Como será seu consumo de entretenimento?",
		options: [
			{
				level: "economico",
				levelEmoji: "💸",
				label: "Econômico",
				description: "Sem assinaturas",
				money: 0,
				happiness: -1,
			},
			{
				level: "equilibrado",
				levelEmoji: "⚖️",
				label: "Equilibrado",
				description: "1 ou 2 streamings",
				money: -80,
				happiness: 2,
			},
			{
				level: "premium",
				levelEmoji: "💎",
				label: "Premium",
				description: "Todos os streamings",
				money: -200,
				happiness: 3,
			},
		],
	},
	{
		key: "saude",
		emoji: "🏥",
		cardNumber: 5,
		title: "Saúde",
		prompt: "Como você vai cuidar da sua saúde?",
		options: [
			{
				level: "economico",
				levelEmoji: "💸",
				label: "Econômico",
				description: "Sem plano de saúde",
				money: -100,
				happiness: -2,
			},
			{
				level: "equilibrado",
				levelEmoji: "⚖️",
				label: "Equilibrado",
				description: "Plano básico",
				money: -300,
				happiness: 1,
			},
			{
				level: "premium",
				levelEmoji: "💎",
				label: "Premium",
				description: "Plano completo",
				money: -800,
				happiness: 3,
			},
		],
	},
	{
		key: "atividade",
		emoji: "🏋️",
		cardNumber: 6,
		title: "Atividade física",
		prompt: "Qual será sua rotina de exercícios?",
		options: [
			{
				level: "economico",
				levelEmoji: "💸",
				label: "Econômico",
				description: "Exercícios em casa",
				money: 0,
				happiness: 1,
			},
			{
				level: "equilibrado",
				levelEmoji: "⚖️",
				label: "Equilibrado",
				description: "Academia",
				money: -120,
				happiness: 2,
			},
			{
				level: "premium",
				levelEmoji: "💎",
				label: "Premium",
				description: "Personal trainer",
				money: -400,
				happiness: 4,
			},
		],
	},
	{
		key: "internet",
		emoji: "🃏",
		cardNumber: 7,
		title: "Plano de Internet",
		prompt:
			"A internet da sua casa impacta estudo, trabalho e lazer. O que você escolhe?",
		options: [
			{
				level: "economico",
				levelEmoji: "💸",
				label: "Econômico",
				description: "Internet básica",
				note: "Velocidade limitada. Pode travar em horários de pico.",
				money: -60,
				happiness: -1,
			},
			{
				level: "equilibrado",
				levelEmoji: "⚖️",
				label: "Equilibrado",
				description: "Internet estável",
				note: "Boa velocidade para estudar, trabalhar e assistir conteúdos.",
				money: -120,
				happiness: 2,
			},
			{
				level: "premium",
				levelEmoji: "💎",
				label: "Premium",
				description: "Internet ultra rápida",
				note: "Alta performance para jogos, streaming e múltiplos dispositivos.",
				money: -250,
				happiness: 4,
			},
		],
	},
];

export const CHOICE_ORDER = MONTHLY_CHOICE_CARDS.map((c) => c.key);

/** Penalty per choice changed mid-month */
export const CHANGE_PENALTY = 100;

/** Compute total monthly money cost and happiness effect from a choices map */
export function computeMonthlyChoiceEffects(choices: Record<string, string>): {
	money: number;
	happiness: number;
} {
	let money = 0;
	let happiness = 0;
	for (const card of MONTHLY_CHOICE_CARDS) {
		const level = choices[card.key] as ChoiceLevel | undefined;
		const opt = card.options.find((o) => o.level === level);
		if (opt) {
			money += opt.money;
			happiness += opt.happiness;
		}
	}
	return { money, happiness };
}

/** Default to all 'economico' */
export function defaultChoices(): Record<string, string> {
	const r: Record<string, string> = {};
	for (const card of MONTHLY_CHOICE_CARDS) {
		r[card.key] = "economico";
	}
	return r;
}
