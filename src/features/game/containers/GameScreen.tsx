"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/containers/auth/hooks/useAuth";
import { AvatarCreator } from "@/src/features/game/components/AvatarCreator";
import {
	CardReveal,
	type GameCard,
} from "@/src/features/game/components/CardReveal";
import {
	buildFloatingEffects,
	FloatingEffect,
	type FloatingEffectItem,
} from "@/src/features/game/components/FloatingEffect";
import { GameBoard } from "@/src/features/game/components/GameBoard";
import { GameLobby } from "@/src/features/game/components/GameLobby";
import {
	MonthEndSummary,
	type MonthSummaryData,
} from "@/src/features/game/components/MonthEndSummary";
import { MonthlyChoicesModal } from "@/src/features/game/components/MonthlyChoicesModal";
import { NewGameConfirmDialog } from "@/src/features/game/components/NewGameConfirmDialog";
import { Roulette } from "@/src/features/game/components/Roulette";
import { TutorialModal } from "@/src/features/game/components/TutorialModal";
import { useGameEngine } from "@/src/features/game/hooks/useGameEngine";
import { AppHeader } from "@/src/shared/components/AppHeader";
import type { PlanType } from "@/types/user";

// ─── Screen / Turn state machines ────────────────────────────────────────────
type UIScreen = "LOBBY" | "AVATAR_CREATOR" | "GAME" | "GAME_OVER";
type TurnPhase = "AGUARDANDO_ROLETA" | "CARTA" | "ATUALIZANDO";

export function GameScreen() {
	const router = useRouter();
	const { user, isLoading: authLoading, logout, mutate } = useAuth();

	const {
		session,
		sessions,
		logs,
		isLoading,
		isSubmitting,
		error,
		gameOver,
		happinessTint,
		avatarFace,
		startNewGame,
		patchSession,
		advanceTurn,
		drawCard,
		shouldDrawCard,
		pickCategory,
		loadSession,
		fetchSessions,
	} = useGameEngine({ userId: user?.id ?? 0 });

	// ── Screen state ──────────────────────────────────────────────────────────
	const [uiScreen, setUIScreen] = useState<UIScreen>("LOBBY");
	const [showNewGameConfirm, setShowNewGameConfirm] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	// ── Turn state ────────────────────────────────────────────────────────────
	const [phase, setPhase] = useState<TurnPhase>("AGUARDANDO_ROLETA");
	const [pendingCard, setPendingCard] = useState<GameCard | null>(null);
	const [pendingRoulette, setPendingRoulette] = useState<number>(1);
	const [floatingEffects, setFloatingEffects] = useState<FloatingEffectItem[]>(
		[],
	);

	const [displayDay, setDisplayDay] = useState(1);
	const [isAnimating, setIsAnimating] = useState(false);
	const isAnimatingRef = useRef(false);

	// Tutorial
	const [tutorialOpen, setTutorialOpen] = useState(false);

	// Monthly choices modal
	const [monthlyChoicesOpen, setMonthlyChoicesOpen] = useState(false);
	const [choicesPendingMonth, setChoicesPendingMonth] = useState(1);

	// Month end summary
	const [summaryOpen, setSummaryOpen] = useState(false);
	const [summaryData, setSummaryData] = useState<MonthSummaryData | null>(null);

	// Extract session fields used as effect deps
	const sessionId = session?.id;
	const sessionDay = session ? Number(session.current_day) : null;
	const tutorialShown = session?.tutorial_shown ?? false;
	const hasChoices = Object.keys(session?.monthly_choices ?? {}).length > 0;

	// ── Auth redirect ──────────────────────────────────────────────────────────
	useEffect(() => {
		if (!authLoading && !user) {
			router.replace("/login");
		}
	}, [authLoading, router, user]);

	// ── When game ends while playing, transition to game over screen ───────────
	useEffect(() => {
		if (gameOver && uiScreen === "GAME") {
			setUIScreen("GAME_OVER");
		}
	}, [gameOver, uiScreen]);

	// ── Tutorial: show once after session first created ───────────────────────
	useEffect(() => {
		if (session && !session.tutorial_shown && uiScreen === "GAME") {
			setTutorialOpen(true);
		}
	}, [session, uiScreen]);

	// ── Sync displayDay only when session identity changes ────────────────────
	useEffect(() => {
		if (sessionId != null && sessionDay != null) {
			setDisplayDay(sessionDay);
		}
	}, [sessionId, sessionDay]);

	// ── Show monthly choices on day 1 if not yet set ──────────────────────────
	useEffect(() => {
		if (!sessionId || sessionDay !== 1 || !tutorialShown || hasChoices) return;
		setChoicesPendingMonth(1);
		setMonthlyChoicesOpen(true);
	}, [sessionId, sessionDay, tutorialShown, hasChoices]);

	// ── Lobby handlers ────────────────────────────────────────────────────────
	const handleContinue = useCallback(
		(id: number) => {
			void loadSession(id);
			setPhase("AGUARDANDO_ROLETA");
			setUIScreen("GAME");
		},
		[loadSession],
	);

	const handleViewResult = useCallback(
		(id: number) => {
			void loadSession(id);
			setUIScreen("GAME_OVER");
		},
		[loadSession],
	);

	const handleNewGameRequest = useCallback(() => {
		const hasActive = sessions.some((s) => s.status === "ACTIVE");
		if (hasActive) {
			setShowNewGameConfirm(true);
		} else {
			setUIScreen("AVATAR_CREATOR");
		}
	}, [sessions]);

	const handleDeleteSession = useCallback(
		async (id: number) => {
			setIsDeleting(true);
			try {
				await fetch(`/api/game/sessions/${id}`, { method: "DELETE" });
				await fetchSessions();
				// If the deleted session is the currently loaded one, go back to lobby
				if (session?.id === id) {
					setUIScreen("LOBBY");
				}
			} finally {
				setIsDeleting(false);
			}
		},
		[fetchSessions, session?.id],
	);

	// ── Roulette result handler ───────────────────────────────────────────────
	const handleRouletteResult = useCallback(
		async (rouletteValue: number) => {
			if (!session || isAnimatingRef.current) return;
			setPendingRoulette(rouletteValue);

			const startDay = Number(session.current_day);
			isAnimatingRef.current = true;
			setIsAnimating(true);
			for (let step = 1; step <= rouletteValue; step++) {
				await new Promise<void>((r) => setTimeout(r, 300));
				setDisplayDay(Math.min(startDay + step, 365));
			}
			isAnimatingRef.current = false;
			setIsAnimating(false);

			if (shouldDrawCard()) {
				const category = pickCategory();
				const card = drawCard(category);
				if (card) {
					setPendingCard(card);
					setPhase("CARTA");
					return;
				}
			}

			setPhase("ATUALIZANDO");
			const result = await advanceTurn({ rouletteResult: rouletteValue });
			if (!result) {
				setPhase("AGUARDANDO_ROLETA");
				return;
			}
			if (result.monthStart && result.newMonth) {
				setChoicesPendingMonth(result.newMonth);
				setMonthlyChoicesOpen(true);
				return;
			}
			setPhase("AGUARDANDO_ROLETA");
		},
		[advanceTurn, drawCard, pickCategory, session, shouldDrawCard],
	);

	// ── Card choice handler ───────────────────────────────────────────────────
	const handleCardChoice = useCallback(
		(choiceIndex: number | null) => {
			if (!pendingCard) return;
			const prevMoney = Number(session?.money ?? 0);
			const prevHappiness = Number(session?.happiness ?? 0);
			const prevKnowledge = Number(session?.knowledge ?? 0);

			setPhase("ATUALIZANDO");
			void advanceTurn({
				rouletteResult: pendingRoulette,
				cardId: pendingCard.id,
				choiceIndex,
			}).then((result) => {
				setPendingCard(null);
				if (!result) {
					setPhase("AGUARDANDO_ROLETA");
					return;
				}
				const moneyDiff = Number(result.session.money) - prevMoney;
				const happinessDiff = Number(result.session.happiness) - prevHappiness;
				const knowledgeDiff = Number(result.session.knowledge) - prevKnowledge;
				const effects = buildFloatingEffects(
					moneyDiff,
					happinessDiff,
					knowledgeDiff,
				);
				if (effects.length > 0) {
					setFloatingEffects((prev) => [...prev, ...effects]);
				}

				if (result.monthStart && result.newMonth) {
					setChoicesPendingMonth(result.newMonth);
					setMonthlyChoicesOpen(true);
					return;
				}
				setPhase("AGUARDANDO_ROLETA");
			});
		},
		[advanceTurn, pendingCard, pendingRoulette, session],
	);

	// ── Monthly choices confirmed ─────────────────────────────────────────────
	const handleMonthlyChoices = useCallback(
		async (choices: Record<string, string>) => {
			await patchSession({ monthlyChoices: choices });
			setMonthlyChoicesOpen(false);
			setPhase("AGUARDANDO_ROLETA");

			if (session && choicesPendingMonth > 1) {
				const prevMonth = choicesPendingMonth - 1;
				try {
					const res = await fetch(
						`/api/game/month-summary?sessionId=${session.id}&month=${prevMonth}`,
					);
					const json = (await res.json()) as { summary?: MonthSummaryData };
					if (res.ok && json.summary) {
						setSummaryData(json.summary);
						setSummaryOpen(true);
					}
				} catch {
					// silent
				}
			}
		},
		[choicesPendingMonth, patchSession, session],
	);

	// ── Remove floating effect ────────────────────────────────────────────────
	const removeEffect = useCallback((id: string) => {
		setFloatingEffects((prev) => prev.filter((e) => e.id !== id));
	}, []);

	// ── Render guards ─────────────────────────────────────────────────────────
	if (authLoading || isLoading) {
		return (
			<main className="flex min-h-screen items-center justify-center">
				<p className="text-sm text-muted-foreground">Carregando jogo...</p>
			</main>
		);
	}

	if (!user) return null;

	const headerProps = {
		user,
		onLogout: logout,
		onPlanUpdated: (planType: PlanType) =>
			mutate(
				(current) =>
					current?.user ? { user: { ...current.user, planType } } : current,
				false,
			),
	};

	const activeSession = sessions.find((s) => s.status === "ACTIVE");

	// ── Lobby ─────────────────────────────────────────────────────────────────
	if (uiScreen === "LOBBY") {
		return (
			<main className="min-h-screen bg-background p-4 text-foreground md:p-6">
				<div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
					<AppHeader {...headerProps} />
					{showNewGameConfirm && activeSession && (
						<NewGameConfirmDialog
							activeSession={activeSession}
							onConfirm={() => {
								setShowNewGameConfirm(false);
								setUIScreen("AVATAR_CREATOR");
							}}
							onCancel={() => setShowNewGameConfirm(false)}
						/>
					)}
					<GameLobby
						sessions={sessions}
						isDeleting={isDeleting}
						onContinue={handleContinue}
						onViewResult={handleViewResult}
						onNewGame={handleNewGameRequest}
						onDelete={(id) => void handleDeleteSession(id)}
					/>
				</div>
			</main>
		);
	}

	// ── Avatar creator ────────────────────────────────────────────────────────
	if (uiScreen === "AVATAR_CREATOR") {
		return (
			<main className="min-h-screen bg-background p-4 text-foreground md:p-6">
				<div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
					<AppHeader {...headerProps} />
					<Button
						variant="ghost"
						size="sm"
						className="self-start"
						onClick={() => setUIScreen("LOBBY")}
					>
						← Voltar ao lobby
					</Button>
					{error && (
						<p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
							{error}
						</p>
					)}
					<AvatarCreator
						isSubmitting={isSubmitting}
						onStart={async (config) => {
							const ok = await startNewGame({
								characterName: config.characterName,
								avatarHair: config.avatarHair,
								avatarSkin: config.avatarSkin,
								avatarOutfit: config.avatarOutfit,
							});
							if (ok) {
								await fetchSessions();
								setPhase("AGUARDANDO_ROLETA");
								setUIScreen("GAME");
							}
						}}
					/>
				</div>
			</main>
		);
	}

	// ── Game over ─────────────────────────────────────────────────────────────
	if (uiScreen === "GAME_OVER" || gameOver) {
		const scoreEstimate = session
			? Math.round(
					Number(session.money) / 100 +
						Number(session.knowledge) * 10 +
						Number(session.credit_score) / 10,
				)
			: 0;
		return (
			<main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-4">
				<AppHeader {...headerProps} />
				<Card className="w-full max-w-md text-center">
					<CardHeader>
						<CardTitle className="text-2xl">🎉 Jornada concluída!</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<p className="text-5xl">{avatarFace}</p>
						<p className="text-lg font-semibold">{session?.character_name}</p>
						<p className="text-sm text-muted-foreground">
							Você completou {session?.current_day} dias de decisões
							financeiras!
						</p>
						<div className="grid grid-cols-2 gap-3 text-sm">
							<div className="rounded-lg border border-border p-3">
								<p className="text-xs text-muted-foreground">Saldo final</p>
								<p className="font-semibold">
									R${" "}
									{Number(session?.money ?? 0).toLocaleString("pt-BR", {
										minimumFractionDigits: 2,
									})}
								</p>
							</div>
							<div className="rounded-lg border border-border p-3">
								<p className="text-xs text-muted-foreground">Score estimado</p>
								<p className="font-semibold text-primary">
									{scoreEstimate} pts
								</p>
							</div>
							<div className="rounded-lg border border-border p-3">
								<p className="text-xs text-muted-foreground">Felicidade</p>
								<p className="font-semibold">
									{session?.happiness ?? 0}/100 😊
								</p>
							</div>
							<div className="rounded-lg border border-border p-3">
								<p className="text-xs text-muted-foreground">
									Score de crédito
								</p>
								<p className="font-semibold">{session?.credit_score ?? 0} 💳</p>
							</div>
						</div>
						<div className="flex gap-2">
							<Button
								className="flex-1"
								variant="outline"
								onClick={() => {
									void fetchSessions();
									setUIScreen("LOBBY");
								}}
							>
								← Voltar ao lobby
							</Button>
							<Button
								className="flex-1"
								onClick={() => {
									void fetchSessions();
									setUIScreen("LOBBY");
									setTimeout(() => handleNewGameRequest(), 50);
								}}
							>
								Nova jornada
							</Button>
						</div>
					</CardContent>
				</Card>
			</main>
		);
	}

	// ── Main game UI ──────────────────────────────────────────────────────────
	if (!session) {
		return (
			<main className="flex min-h-screen items-center justify-center">
				<p className="text-sm text-muted-foreground">Carregando sessão...</p>
			</main>
		);
	}

	const currentMonth = Math.ceil(Number(session.current_day) / 30);
	const isRolling = phase === "ATUALIZANDO" || isAnimating;

	return (
		<main
			className={`min-h-screen p-4 text-foreground transition-colors md:p-6 ${happinessTint} bg-background`}
		>
			<FloatingEffect items={floatingEffects} onRemove={removeEffect} />

			{/* Modals */}
			<TutorialModal
				open={tutorialOpen}
				onClose={() => {
					setTutorialOpen(false);
					void patchSession({ tutorialShown: true });
					if (session && Number(session.current_day) === 1) {
						const existing = session.monthly_choices ?? {};
						if (Object.keys(existing).length === 0) {
							setChoicesPendingMonth(1);
							setMonthlyChoicesOpen(true);
						}
					}
				}}
			/>

			<CardReveal card={pendingCard} onChoice={handleCardChoice} />

			<MonthlyChoicesModal
				open={monthlyChoicesOpen}
				month={choicesPendingMonth}
				initialChoices={
					(session.monthly_choices ?? {}) as Record<string, string>
				}
				onConfirm={(choices) => void handleMonthlyChoices(choices)}
			/>

			<MonthEndSummary
				open={summaryOpen}
				data={summaryData}
				onClose={() => {
					setSummaryOpen(false);
					setSummaryData(null);
				}}
			/>

			<div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
				<AppHeader {...headerProps} />

				{error && (
					<p className="rounded-md border border-destructive/30 bg-destructive/10 p-2 text-sm text-destructive">
						{error}
					</p>
				)}

				{/* Top bar */}
				<div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-3">
					<div className="flex items-center gap-3">
						<Button
							size="sm"
							variant="ghost"
							className="px-2 text-muted-foreground"
							onClick={() => {
								void fetchSessions();
								setUIScreen("LOBBY");
							}}
						>
							← Lobby
						</Button>
						<span className="text-3xl">{avatarFace}</span>
						<div>
							<p className="font-semibold">{session.character_name}</p>
							<p className="text-xs text-muted-foreground">
								Escritório · Salário R$ 2.000/mês
							</p>
						</div>
					</div>
					<div className="flex flex-wrap gap-4 text-sm">
						<div className="text-center">
							<p className="text-xs text-muted-foreground">Dia</p>
							<p className="font-bold text-primary">
								{session.current_day}/365
							</p>
						</div>
						<div className="text-center">
							<p className="text-xs text-muted-foreground">Mês</p>
							<p className="font-bold">{currentMonth}</p>
						</div>
						<div className="text-center">
							<p className="text-xs text-muted-foreground">Dinheiro</p>
							<p className="font-bold text-green-600">
								R${" "}
								{Number(session.money).toLocaleString("pt-BR", {
									minimumFractionDigits: 2,
								})}
							</p>
						</div>
						<div className="text-center">
							<p className="text-xs text-muted-foreground">😊</p>
							<p className="font-bold">{session.happiness}</p>
						</div>
						<div className="text-center">
							<p className="text-xs text-muted-foreground">📚</p>
							<p className="font-bold">{session.knowledge}</p>
						</div>
						<div className="text-center">
							<p className="text-xs text-muted-foreground">💳</p>
							<p className="font-bold">{session.credit_score}</p>
						</div>
					</div>
					<Button
						size="sm"
						variant="ghost"
						onClick={() => setTutorialOpen(true)}
					>
						Tutorial
					</Button>
				</div>

				{/* Board + Roulette layout */}
				<div className="flex flex-col gap-4 lg:flex-row">
					{/* Tabuleiro */}
					<div className="flex-1">
						<GameBoard
							currentDay={Number(session.current_day)}
							displayDay={displayDay}
							logs={logs}
							avatarFace={avatarFace}
						/>
					</div>

					{/* Status panel */}
					<div className="flex flex-col gap-4 lg:w-64">
						<Card>
							<CardHeader className="pb-2">
								<CardTitle className="text-sm">Status detalhado</CardTitle>
							</CardHeader>
							<CardContent className="space-y-2 text-sm">
								{[
									{
										label: "Felicidade",
										value: session.happiness,
										max: 100,
										color: "bg-yellow-400",
									},
									{
										label: "Conhecimento",
										value: session.knowledge,
										max: 100,
										color: "bg-blue-400",
									},
									{
										label: "Crédito",
										value: session.credit_score,
										max: 1000,
										color: "bg-purple-400",
									},
								].map(({ label, value, max, color }) => (
									<div key={label}>
										<div className="flex justify-between text-xs text-muted-foreground">
											<span>{label}</span>
											<span>
												{value}/{max}
											</span>
										</div>
										<div className="h-2 overflow-hidden rounded-full bg-muted">
											<div
												className={`h-full rounded-full ${color} transition-all duration-500`}
												style={{ width: `${(Number(value) / max) * 100}%` }}
											/>
										</div>
									</div>
								))}
							</CardContent>
						</Card>

						{/* Roulette */}
						<Card>
							<CardHeader className="pb-2">
								<CardTitle className="text-sm">Sua vez</CardTitle>
							</CardHeader>
							<CardContent className="flex justify-center py-2">
								<Roulette
									disabled={isRolling || phase === "CARTA" || isSubmitting}
									onResult={handleRouletteResult}
								/>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</main>
	);
}
