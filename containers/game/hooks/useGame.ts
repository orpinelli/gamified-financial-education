"use client";

import { useState, useCallback, useMemo } from "react";
import useSWR from "swr";
import type { GameSession, DayLog, GameEvent, StatEffects } from "@/types/game";
import { PROFESSIONS, calculateSalary } from "@/data/professions";
import {
	GAME_EVENTS,
	getRandomEvent,
	isSalaryDay,
	SALARY_EVENT,
} from "@/data/events";
import { GAME_CONFIG } from "@/data/game-config";

const fetcher = async (url: string) => {
	const res = await fetch(url);
	if (!res.ok) throw new Error("Erro ao carregar sessao");
	return res.json();
};

function rollDice(count: 1 | 2 = 2): number[] {
	const dice: number[] = [];
	for (let i = 0; i < count; i++) {
		dice.push(Math.floor(Math.random() * 6) + 1);
	}
	return dice;
}

function getEventForDay(
	day: number,
	professionId: string,
	stats: {
		money: number;
		knowledge: number;
		happiness: number;
		energy: number;
		health: number;
	},
	logs?: DayLog[],
): GameEvent {
	const profession = PROFESSIONS.find((p) => p.id === professionId);
	if (!profession) return GAME_EVENTS[0];

	// Salary day
	if (isSalaryDay(day)) {
		// Contar quantos dias TRABALHAR no mês
		let workedDays = 0;
		if (logs && logs.length > 0) {
			// Considera apenas os últimos 30 dias
			const last30 = logs.filter((l) => l.day > day - 30 && l.day <= day);
			workedDays = last30.filter((l) =>
				l.choice_made?.includes("MANHA:TRABALHAR"),
			).length;
		} else {
			workedDays = 30; // fallback para salário cheio
		}
		const salaryFull = calculateSalary(profession, stats.knowledge);
		const salary = Math.round(salaryFull * (workedDays / 30));
		const salaryEvent: GameEvent = {
			...SALARY_EVENT,
			id: `pagamento_salario_${day}`,
			description: `Hoje é dia de receber seu salário como ${profession.name}. Você trabalhou ${workedDays}/30 dias. Valor: R$${salary.toFixed(2)}`,
			options: [
				{
					...SALARY_EVENT.options[0],
					effects: { money: salary, happiness: 10 },
				},
			],
		};
		return salaryEvent;
	}

	// Use day-based seed for deterministic event selection
	return getRandomEvent(day, stats);
}

export function useGame() {
	const { data, isLoading, mutate } = useSWR<{
		session: GameSession | null;
		logs: DayLog[];
	}>("/api/game/session", fetcher, {
		revalidateOnFocus: false,
	});

	const [currentEvent, setCurrentEvent] = useState<GameEvent | null>(null);
	const [diceValues, setDiceValues] = useState<number[]>([]);
	const [isRolling, setIsRolling] = useState(false);
	const [isAdvancing, setIsAdvancing] = useState(false);
	const [gameOverScreen, setGameOverScreen] = useState(false);

	const session = data?.session ?? null;
	const logs = data?.logs ?? [];

	const profession = useMemo(
		() => PROFESSIONS.find((p) => p.id === session?.profession_id) ?? null,
		[session?.profession_id],
	);

	const createSession = useCallback(
		async (characterName: string, professionId: string) => {
			const res = await fetch("/api/game/session", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ characterName, professionId }),
			});
			const json = await res.json();
			if (!res.ok) throw new Error(json.error);
			await mutate();
			return json.session;
		},
		[mutate],
	);

	const triggerEvent = useCallback(() => {
		if (!session) return;
		const stats = {
			money: Number(session.money),
			knowledge: Number(session.knowledge),
			happiness: Number(session.happiness),
			energy: Number(session.energy),
			health: Number(session.health),
		};
		const event = getEventForDay(
			Number(session.current_day),
			session.profession_id,
			stats,
			logs,
		);
		setCurrentEvent(event);
		setDiceValues([]);
	}, [session, logs]);

	const rollDiceAction = useCallback((count: 1 | 2 = 2): number[] => {
		setIsRolling(true);
		const dice = rollDice(count);

		setTimeout(() => {
			setDiceValues(dice);
			setIsRolling(false);
		}, 800);

		return dice;
	}, []);

	const advanceDay = useCallback(
		async (choiceLabel: string, effects: StatEffects, diceResult?: number) => {
			if (!session || !currentEvent) return;

			setIsAdvancing(true);
			try {
				const res = await fetch("/api/game/advance", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						sessionId: session.id,
						eventType: currentEvent.category,
						eventTitle: currentEvent.title,
						choiceMade: choiceLabel,
						diceResult: diceResult ?? null,
						effects,
					}),
				});

				const json = await res.json();
				if (!res.ok) throw new Error(json.error);

				if (json.gameOver) {
					setGameOverScreen(true);
				}

				setCurrentEvent(null);
				setDiceValues([]);
				await mutate();
			} finally {
				setIsAdvancing(false);
			}
		},
		[session, currentEvent, mutate],
	);

	const totalDays = GAME_CONFIG.TOTAL_DAYS;
	const currentDay = session ? Number(session.current_day) : 1;
	const progress = Math.round((currentDay / totalDays) * 100);

	return {
		session,
		logs,
		profession,
		isLoading,
		currentEvent,
		diceValues,
		isRolling,
		isAdvancing,
		gameOverScreen,
		currentDay,
		totalDays,
		progress,
		createSession,
		triggerEvent,
		rollDiceAction,
		advanceDay,
		setGameOverScreen,
		setCurrentEvent,
		mutate,
	};
}
