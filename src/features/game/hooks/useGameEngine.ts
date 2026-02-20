"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { GameState, Profession } from "@/src/shared/types/domain";
import { INITIAL_PROFESSIONS } from "@/src/features/game/data/professions";

interface GameSessionResponse {
	id: number;
	user_id: number;
	character_name: string;
	profession_id: string;
	current_day: number;
	money: number;
	knowledge: number;
	happiness: number;
	energy: number;
	status: "ACTIVE" | "COMPLETED";
}

interface UseGameEngineParams {
	userId: number;
}

export interface GameDayLog {
	day: number;
	event_type: string;
	event_title: string;
	choice_made: string;
}

export type MorningAction = "TRABALHAR" | "LAZER" | "FALTAR" | "ESTUDAR";
export type EveningAction = "ESTUDAR" | "LAZER" | "DORMIR";

export interface DailyRoutinePlan {
	morningAction: MorningAction;
	eveningAction: EveningAction;
	takeOvertime: boolean;
	journeyEnergyDelta: number;
	journeyHappinessDelta: number;
	journeyStressGain: boolean;
	journeyStory: string;
	dayStory: string;
}

export interface DailyRoutineOutcome {
	overtimeApplied: boolean;
	motivationFactor: number;
	nextStressDays: number;
	dayStory: string;
}

export interface DiceRoll {
	values: number[];
	total: number;
}

interface ParsedChoiceMeta {
	hasLazer: boolean;
	stressGain: boolean;
}

function getProfessionById(professionId: string): Profession {
	const found = INITIAL_PROFESSIONS.find(
		(profession) => profession.id === professionId,
	);
	return found ?? INITIAL_PROFESSIONS[0];
}

function toGameState(session: GameSessionResponse): GameState {
	return {
		userId: session.user_id,
		day: Number(session.current_day),
		money: Number(session.money),
		knowledge: Number(session.knowledge),
		happiness: Number(session.happiness),
		energy: Number(session.energy),
		profession: getProfessionById(session.profession_id),
	};
}

function clampFactor(value: number): number {
	if (value < 0.45) return 0.45;
	if (value > 1) return 1;
	return value;
}

function getMotivationFactor(state: GameState): number {
	const dayPenalty = Math.min(0.4, state.day * 0.004);
	const happinessPenalty =
		state.happiness < 35 ? 0.3 : state.happiness < 55 ? 0.16 : 0;

	return clampFactor(1 - dayPenalty - happinessPenalty);
}

function parseChoiceMeta(choiceMade: string): ParsedChoiceMeta {
	const normalized = choiceMade.toUpperCase();
	const hasLazer =
		normalized.includes("MANHA:LAZER") ||
		normalized.includes("NOITE:LAZER") ||
		normalized.includes("HAS_LAZER:1");
	const stressGain =
		normalized.includes("STRESS_GAIN:1") || normalized.includes("STRESS:SIM");

	return { hasLazer, stressGain };
}

function computeStressDaysFromLogs(logs: GameDayLog[]): number {
	let stressDays = 0;

	for (const log of logs) {
		stressDays = Math.max(0, stressDays - 1);
		const meta = parseChoiceMeta(log.choice_made);

		if (meta.hasLazer) {
			stressDays = 0;
		}

		if (meta.stressGain && !meta.hasLazer) {
			stressDays = 3;
		}
	}

	return stressDays;
}

function resolveEventType(plan: DailyRoutinePlan): string {
	if (plan.morningAction === "TRABALHAR" || plan.takeOvertime) {
		return "TRABALHO_ROTINA";
	}

	if (plan.morningAction === "ESTUDAR" || plan.eveningAction === "ESTUDAR") {
		return "ESTUDO_ROTINA";
	}

	if (plan.morningAction === "LAZER" || plan.eveningAction === "LAZER") {
		return "LAZER_ROTINA";
	}

	return "ROTINA_DIARIA";
}

function resolveEffects(
	state: GameState,
	plan: DailyRoutinePlan,
	overtimeAvailable: boolean,
	stressDaysRemaining: number,
): {
	effects: Record<string, number>;
	motivationFactor: number;
	effectiveFactor: number;
	overtimeApplied: boolean;
} {
	const motivationFactor = getMotivationFactor(state);
	const stressPenaltyFactor = stressDaysRemaining > 0 ? 0.5 : 1;
	const effectiveFactor = motivationFactor * stressPenaltyFactor;
	const effects: Record<string, number> = {
		happiness: -2,
		energy: -3,
	};

	if (plan.morningAction === "TRABALHAR") {
		effects.money = (effects.money ?? 0) + state.profession.baseSalary * 0.08;
		effects.energy = (effects.energy ?? 0) - 12;
		effects.happiness = (effects.happiness ?? 0) - 4;
	}

	if (plan.morningAction === "LAZER") {
		effects.money = (effects.money ?? 0) - 20;
		effects.happiness = (effects.happiness ?? 0) + 10;
		effects.energy = (effects.energy ?? 0) + 4;
	}

	if (plan.morningAction === "FALTAR") {
		effects.money = (effects.money ?? 0) - 65;
		effects.happiness = (effects.happiness ?? 0) + 6;
		effects.energy = (effects.energy ?? 0) + 7;
	}

	if (plan.morningAction === "ESTUDAR") {
		effects.knowledge =
			(effects.knowledge ?? 0) + Math.round(10 * effectiveFactor);
		effects.energy = (effects.energy ?? 0) - 9;
		effects.happiness = (effects.happiness ?? 0) - 3;
	}

	const overtimeApplied =
		overtimeAvailable &&
		plan.morningAction === "TRABALHAR" &&
		plan.takeOvertime;

	if (overtimeApplied) {
		effects.money = (effects.money ?? 0) + Math.round(65 * effectiveFactor);
		effects.energy = (effects.energy ?? 0) - 11;
		effects.happiness = (effects.happiness ?? 0) - 5;
	}

	if (plan.eveningAction === "ESTUDAR") {
		effects.knowledge =
			(effects.knowledge ?? 0) + Math.round(8 * effectiveFactor);
		effects.energy = (effects.energy ?? 0) - 7;
		effects.happiness = (effects.happiness ?? 0) - 2;
	}

	if (plan.eveningAction === "LAZER") {
		effects.money = (effects.money ?? 0) - 25;
		effects.happiness = (effects.happiness ?? 0) + 12;
		effects.energy = (effects.energy ?? 0) + 6;
	}

	if (plan.eveningAction === "DORMIR") {
		effects.energy = (effects.energy ?? 0) + 14;
		effects.happiness = (effects.happiness ?? 0) + 2;
	}

	effects.energy = (effects.energy ?? 0) + plan.journeyEnergyDelta;
	effects.happiness = (effects.happiness ?? 0) + plan.journeyHappinessDelta;

	return {
		effects,
		motivationFactor,
		effectiveFactor,
		overtimeApplied,
	};
}

function randomOvertimeChance(): boolean {
	return Math.random() < 0.45;
}

export function useGameEngine({ userId }: UseGameEngineParams) {
	const [session, setSession] = useState<GameSessionResponse | null>(null);
	const [playerName, setPlayerName] = useState("Jogador");
	const [isLoading, setIsLoading] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string>("");
	const [gameOver, setGameOver] = useState(false);
	const [overtimeAvailable, setOvertimeAvailable] = useState(false);
	const [stressDaysRemaining, setStressDaysRemaining] = useState(0);
	const [logs, setLogs] = useState<GameDayLog[]>([]);

	const gameState = useMemo(
		() => (session ? toGameState(session) : null),
		[session],
	);

	const header = useMemo(() => {
		if (!gameState) {
			return {
				playerName,
				professionName: "",
				currentDay: 0,
				money: 0,
			};
		}

		return {
			playerName,
			professionName: gameState.profession.name,
			currentDay: gameState.day,
			money: gameState.money,
		};
	}, [gameState, playerName]);

	const motivation = useMemo(() => {
		if (!gameState) {
			return { factor: 1, discouragement: 0 };
		}

		const factor = getMotivationFactor(gameState);
		return {
			factor,
			discouragement: Math.round((1 - factor) * 100),
		};
	}, [gameState]);

	const refreshSession = useCallback(async () => {
		setIsLoading(true);
		setError("");

		try {
			const response = await fetch("/api/game/session");
			const data = (await response.json()) as {
				error?: string;
				session?: GameSessionResponse | null;
				logs?: Array<{
					day: number;
					event_type: string;
					event_title: string;
					choice_made?: string;
				}>;
			};

			if (!response.ok) {
				setError(data.error ?? "Nao foi possivel carregar a sessao.");
				setSession(null);
				setOvertimeAvailable(false);
				setStressDaysRemaining(0);
				setLogs([]);
				return;
			}

			if (!data.session) {
				setSession(null);
				setOvertimeAvailable(false);
				setStressDaysRemaining(0);
				setLogs([]);
				return;
			}

			setSession(data.session);
			setPlayerName(data.session.character_name);
			setGameOver(data.session.status === "COMPLETED");
			setOvertimeAvailable(randomOvertimeChance());
			const mappedLogs: GameDayLog[] = (data.logs ?? []).map((log) => ({
				day: Number(log.day),
				event_type: log.event_type,
				event_title: log.event_title,
				choice_made: log.choice_made ?? "",
			}));

			setLogs(mappedLogs);
			setStressDaysRemaining(computeStressDaysFromLogs(mappedLogs));
		} catch {
			setError("Erro de rede ao carregar a sessao.");
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		if (!userId) {
			setIsLoading(false);
			return;
		}

		void refreshSession();
	}, [refreshSession, userId]);

	const startNewGame = useCallback(
		async (characterName: string, professionId: string) => {
			setIsSubmitting(true);
			setError("");

			try {
				const response = await fetch("/api/game/session", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ characterName, professionId }),
				});

				const data = (await response.json()) as {
					error?: string;
					session?: GameSessionResponse;
				};

				if (!response.ok || !data.session) {
					setError(data.error ?? "Nao foi possivel iniciar o jogo.");
					return false;
				}

				setSession(data.session);
				setPlayerName(characterName);
				setGameOver(false);
				setOvertimeAvailable(randomOvertimeChance());
				setStressDaysRemaining(0);
				setLogs([]);
				return true;
			} catch {
				setError("Erro de rede ao iniciar jogo.");
				return false;
			} finally {
				setIsSubmitting(false);
			}
		},
		[],
	);

	const playDailyRoutine = useCallback(
		async (plan: DailyRoutinePlan): Promise<DailyRoutineOutcome | null> => {
			if (!session) {
				return null;
			}

			const currentState = toGameState(session);
			const resolved = resolveEffects(
				currentState,
				plan,
				overtimeAvailable,
				stressDaysRemaining,
			);
			const eventType = resolveEventType(plan);
			const hasLazer =
				plan.morningAction === "LAZER" || plan.eveningAction === "LAZER";
			let nextStressDays = Math.max(0, stressDaysRemaining - 1);

			if (hasLazer) {
				nextStressDays = 0;
			} else if (plan.journeyStressGain) {
				nextStressDays = 3;
			}

			const choiceMade = [
				`Manha:${plan.morningAction}`,
				`Extra:${plan.takeOvertime ? "SIM" : "NAO"}`,
				`Noite:${plan.eveningAction}`,
				`StressGain:${plan.journeyStressGain ? "1" : "0"}`,
				`HasLazer:${hasLazer ? "1" : "0"}`,
			].join("|");

			setIsSubmitting(true);
			setError("");

			try {
				const response = await fetch("/api/game/advance", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						sessionId: session.id,
						eventType,
						eventTitle: plan.dayStory || "Rotina diaria",
						choiceMade,
						diceResult: null,
						effects: resolved.effects,
					}),
				});

				const data = (await response.json()) as {
					error?: string;
					session?: GameSessionResponse;
					gameOver?: boolean;
				};

				if (!response.ok || !data.session) {
					setError(data.error ?? "Nao foi possivel avancar o dia.");
					return null;
				}

				setSession(data.session);
				setGameOver(Boolean(data.gameOver));
				setStressDaysRemaining(nextStressDays);
				setLogs((currentLogs) => [
					...currentLogs,
					{
						day: Number(session.current_day),
						event_type: eventType,
						event_title: plan.dayStory || "Rotina diaria",
						choice_made: choiceMade,
					},
				]);

				if (data.gameOver) {
					setOvertimeAvailable(false);
				} else {
					setOvertimeAvailable(randomOvertimeChance());
				}

				return {
					overtimeApplied: resolved.overtimeApplied,
					motivationFactor: resolved.effectiveFactor,
					nextStressDays,
					dayStory: plan.dayStory,
				};
			} catch {
				setError("Erro de rede ao avancar o dia.");
				return null;
			} finally {
				setIsSubmitting(false);
			}
		},
		[overtimeAvailable, session, stressDaysRemaining],
	);

	return {
		isLoading,
		isSubmitting,
		error,
		gameOver,
		hasActiveSession: Boolean(session),
		header,
		gameState,
		motivation,
		overtimeAvailable,
		stressDaysRemaining,
		logs,
		startNewGame,
		refreshSession,
		playDailyRoutine,
	};
}
