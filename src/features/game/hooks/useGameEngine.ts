"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { GameCard } from "@/src/features/game/components/CardReveal";

// ─── Types ────────────────────────────────────────────────────────────────────

export type GameStatus = "ACTIVE" | "COMPLETED";

export interface SessionSummary {
	id: number;
	character_name: string;
	profession_id: string;
	current_day: number;
	status: GameStatus;
	money: number;
	happiness: number;
	knowledge: number;
	credit_score: number;
	avatar_hair: string;
	avatar_skin: string;
	avatar_outfit: string;
	updated_at: string;
}

export interface GameSession {
	id: number;
	user_id: number;
	character_name: string;
	profession_id: string;
	current_day: number;
	money: number;
	knowledge: number;
	happiness: number;
	energy: number;
	health: number;
	credit_score: number;
	impulse_score: number;
	lifestyle_level: number;
	avatar_hair: string;
	avatar_skin: string;
	avatar_outfit: string;
	tutorial_shown: boolean;
	pending_deferred_card_id: number | null;
	monthly_choices: Record<string, string> | null;
	status: GameStatus;
}

export interface DayLog {
	day: number;
	event_type: string;
	card_id: number | null;
	roulette_result: number | null;
	choice_index: number | null;
	// category joined from game_cards (may be absent in older logs)
	category?: string | null;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

interface UseGameEngineParams {
	userId: number;
}

export function useGameEngine({ userId }: UseGameEngineParams) {
	const [session, setSession] = useState<GameSession | null>(null);
	const [sessions, setSessions] = useState<SessionSummary[]>([]);
	const [logs, setLogs] = useState<DayLog[]>([]);
	const [cards, setCards] = useState<GameCard[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState("");

	// Derived
	const hasActiveSession = Boolean(session);
	const gameOver = session?.status === "COMPLETED";

	// Happiness-based tint class
	const happinessTint = useMemo(() => {
		const h = session?.happiness ?? 70;
		if (h < 40) return "bg-gray-100/40";
		if (h < 70) return "bg-yellow-50/20";
		return "";
	}, [session?.happiness]);

	// Avatar face
	const avatarFace = useMemo(() => {
		const h = session?.happiness ?? 70;
		if (h >= 70) return "😄";
		if (h >= 40) return "😐";
		return "😞";
	}, [session?.happiness]);

	// ── Load sessions list ────────────────────────────────────────────────────
	const fetchSessions = useCallback(async () => {
		try {
			const res = await fetch("/api/game/sessions");
			const data = (await res.json()) as {
				error?: string;
				sessions?: SessionSummary[];
			};
			if (res.ok && data.sessions) setSessions(data.sessions);
		} catch {
			// silent
		}
	}, []);

	// ── Load active session ───────────────────────────────────────────────────
	const refreshSession = useCallback(async () => {
		setIsLoading(true);
		setError("");
		try {
			const res = await fetch("/api/game/session");
			const data = (await res.json()) as {
				error?: string;
				session?: GameSession | null;
				logs?: DayLog[];
			};
			if (!res.ok) {
				setError(data.error ?? "Erro ao carregar sessão.");
				setSession(null);
				setLogs([]);
				return;
			}
			setSession(data.session ?? null);
			setLogs(data.logs ?? []);
		} catch {
			setError("Erro de rede.");
		} finally {
			setIsLoading(false);
		}
	}, []);

	// ── Load a specific session by ID (any status) ────────────────────────────
	const loadSession = useCallback(async (id: number) => {
		setIsLoading(true);
		setError("");
		try {
			const res = await fetch(`/api/game/session?id=${id}`);
			const data = (await res.json()) as {
				error?: string;
				session?: GameSession | null;
				logs?: DayLog[];
			};
			if (!res.ok) {
				setError(data.error ?? "Erro ao carregar sessão.");
				return;
			}
			setSession(data.session ?? null);
			setLogs(data.logs ?? []);
		} catch {
			setError("Erro de rede.");
		} finally {
			setIsLoading(false);
		}
	}, []);

	// ── Load cards (only once) ─────────────────────────────────────────────────
	const loadCards = useCallback(async () => {
		try {
			const res = await fetch("/api/game/cards");
			const data = (await res.json()) as { cards?: GameCard[] };
			if (res.ok && data.cards) setCards(data.cards);
		} catch {
			// silent — cards optional
		}
	}, []);

	useEffect(() => {
		if (!userId) {
			setIsLoading(false);
			return;
		}
		void refreshSession();
		void fetchSessions();
		void loadCards();
	}, [fetchSessions, loadCards, refreshSession, userId]);

	// ── Start new game ────────────────────────────────────────────────────────
	const startNewGame = useCallback(
		async (params: {
			characterName: string;
			avatarHair: string;
			avatarSkin: string;
			avatarOutfit: string;
		}) => {
			setIsSubmitting(true);
			setError("");
			try {
				const res = await fetch("/api/game/session", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(params),
				});
				const data = (await res.json()) as {
					error?: string;
					session?: GameSession;
				};
				if (!res.ok || !data.session) {
					setError(data.error ?? "Erro ao iniciar jogo.");
					return false;
				}
				setSession(data.session);
				setLogs([]);
				return true;
			} catch {
				setError("Erro de rede.");
				return false;
			} finally {
				setIsSubmitting(false);
			}
		},
		[],
	);

	// ── Update session settings (lifestyle/budget/tutorial) ───────────────────
	const patchSession = useCallback(
		async (patch: {
			lifestyleLevel?: number;
			budgetIncomeExpected?: number;
			budgetFixedExpenses?: number;
			budgetEmergencyReserve?: number;
			budgetSavingsGoal?: number;
			tutorialShown?: boolean;
			monthlyChoices?: Record<string, string>;
		}) => {
			if (!session) return;
			try {
				const res = await fetch("/api/game/session", {
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ sessionId: session.id, ...patch }),
				});
				const data = (await res.json()) as { session?: GameSession };
				if (res.ok && data.session) setSession(data.session);
			} catch {
				// silent
			}
		},
		[session],
	);

	// ── Advance turn ──────────────────────────────────────────────────────────
	const advanceTurn = useCallback(
		async (params: {
			rouletteResult: number;
			cardId?: number | null;
			choiceIndex?: number | null;
		}): Promise<{
			session: GameSession;
			gameOver: boolean;
			monthStart: boolean;
			newMonth: number | null;
		} | null> => {
			if (!session) return null;
			setIsSubmitting(true);
			setError("");
			try {
				const res = await fetch("/api/game/advance", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ sessionId: session.id, ...params }),
				});
				const data = (await res.json()) as {
					error?: string;
					session?: GameSession;
					gameOver?: boolean;
					monthStart?: boolean;
					newMonth?: number | null;
				};
				if (!res.ok || !data.session) {
					setError(data.error ?? "Erro ao avançar.");
					return null;
				}
				setSession(data.session);
				setLogs((prev) => [
					...prev,
					{
						day: session.current_day,
						event_type: params.cardId ? "CARD" : "ROLETA",
						card_id: params.cardId ?? null,
						roulette_result: params.rouletteResult,
						choice_index: params.choiceIndex ?? null,
					},
				]);
				return {
					session: data.session,
					gameOver: Boolean(data.gameOver),
					monthStart: Boolean(data.monthStart),
					newMonth: data.newMonth ?? null,
				};
			} catch {
				setError("Erro de rede.");
				return null;
			} finally {
				setIsSubmitting(false);
			}
		},
		[session],
	);

	// ── Draw a random card ────────────────────────────────────────────────────
	const drawCard = useCallback(
		(
			category?: "BOM" | "RUIM" | "DECISAO" | "COMPRA_IMPULSIVA",
		): GameCard | null => {
			const pool = category
				? cards.filter((c) => c.category === category)
				: cards;
			if (pool.length === 0) return null;
			return pool[Math.floor(Math.random() * pool.length)] ?? null;
		},
		[cards],
	);

	// Decide whether a turn draws a card (~70% chance)
	const shouldDrawCard = useCallback(() => Math.random() < 0.7, []);

	// Pick weighted category: 35% BOM, 35% RUIM, 20% DECISAO, 10% COMPRA_IMPULSIVA
	const pickCategory = useCallback(():
		| "BOM"
		| "RUIM"
		| "DECISAO"
		| "COMPRA_IMPULSIVA" => {
		const r = Math.random();
		if (r < 0.35) return "BOM";
		if (r < 0.7) return "RUIM";
		if (r < 0.9) return "DECISAO";
		return "COMPRA_IMPULSIVA";
	}, []);

	return {
		session,
		sessions,
		logs,
		cards,
		isLoading,
		isSubmitting,
		error,
		hasActiveSession,
		gameOver,
		happinessTint,
		avatarFace,
		startNewGame,
		patchSession,
		advanceTurn,
		drawCard,
		shouldDrawCard,
		pickCategory,
		refreshSession,
		fetchSessions,
		loadSession,
	};
}
