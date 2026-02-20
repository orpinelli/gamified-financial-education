"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
	EventOption,
	GameEvent,
	GameState,
	Profession,
} from "@/src/shared/types/domain";
import { INITIAL_GAME_EVENTS } from "@/src/features/game/data/events";
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

export interface DiceRoll {
	values: number[];
	total: number;
}

function rollDice(count: 1 | 2): DiceRoll {
	const values: number[] = Array.from(
		{ length: count },
		() => Math.floor(Math.random() * 6) + 1,
	);

	return {
		values,
		total: values.reduce((acc, value) => acc + value, 0),
	};
}

function getProfessionById(professionId: string): Profession {
	const found = INITIAL_PROFESSIONS.find(
		(profession) => profession.id === professionId,
	);
	return found ?? INITIAL_PROFESSIONS[0];
}

function getEventForDay(day: number): GameEvent {
	const index = (day - 1) % INITIAL_GAME_EVENTS.length;
	return INITIAL_GAME_EVENTS[index];
}

function buildAppliedEffects(option: EventOption, roll: DiceRoll | null) {
	const base = { ...option.effects };

	if (!roll || option.diceCount === 0) {
		return base;
	}

	const threshold = option.successThreshold ?? 0;
	const isSuccess = roll.total >= threshold;

	if (isSuccess && option.successEffects) {
		return { ...base, ...option.successEffects };
	}

	if (!isSuccess && option.failureEffects) {
		return { ...base, ...option.failureEffects };
	}

	return base;
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

export function useGameEngine({ userId }: UseGameEngineParams) {
	const [session, setSession] = useState<GameSessionResponse | null>(null);
	const [playerName, setPlayerName] = useState("Jogador");
	const [isLoading, setIsLoading] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string>("");
	const [gameOver, setGameOver] = useState(false);
	const [lastRoll, setLastRoll] = useState<DiceRoll | null>(null);
	const [currentEvent, setCurrentEvent] = useState<GameEvent | null>(null);

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

	const refreshSession = useCallback(async () => {
		setIsLoading(true);
		setError("");

		try {
			const response = await fetch("/api/game/session");
			const data = (await response.json()) as {
				error?: string;
				session?: GameSessionResponse | null;
			};

			if (!response.ok) {
				setError(data.error ?? "Nao foi possivel carregar a sessao.");
				setSession(null);
				setCurrentEvent(null);
				return;
			}

			if (!data.session) {
				setSession(null);
				setCurrentEvent(null);
				return;
			}

			setSession(data.session);
			setPlayerName(data.session.character_name);
			setCurrentEvent(getEventForDay(Number(data.session.current_day)));
			setGameOver(data.session.status === "COMPLETED");
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
				setCurrentEvent(getEventForDay(Number(data.session.current_day)));
				setLastRoll(null);
				setGameOver(false);
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

	const playTurn = useCallback(
		async (option: EventOption): Promise<DiceRoll | null> => {
			if (!session || !currentEvent) {
				return null;
			}

			setIsSubmitting(true);
			setError("");

			const roll =
				option.diceCount === 1 || option.diceCount === 2
					? rollDice(option.diceCount)
					: null;
			const appliedEffects = buildAppliedEffects(option, roll);

			try {
				const response = await fetch("/api/game/advance", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						sessionId: session.id,
						eventType: currentEvent.id,
						eventTitle: currentEvent.title,
						choiceMade: option.label,
						diceResult: roll?.total ?? null,
						effects: appliedEffects,
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
				setLastRoll(roll);
				setGameOver(Boolean(data.gameOver));

				if (data.gameOver) {
					setCurrentEvent(null);
				} else {
					setCurrentEvent(getEventForDay(Number(data.session.current_day)));
				}

				return roll;
			} catch {
				setError("Erro de rede ao avancar o dia.");
				return null;
			} finally {
				setIsSubmitting(false);
			}
		},
		[currentEvent, session],
	);

	return {
		isLoading,
		isSubmitting,
		error,
		gameOver,
		hasActiveSession: Boolean(session),
		header,
		gameState,
		currentEvent,
		lastRoll,
		startNewGame,
		refreshSession,
		playTurn,
	};
}
