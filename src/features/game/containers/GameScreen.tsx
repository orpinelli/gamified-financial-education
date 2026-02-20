"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useGameEngine } from "@/src/features/game/hooks/useGameEngine";
import { INITIAL_PROFESSIONS } from "@/src/features/game/data/professions";
import { TopBar } from "@/src/features/game/components/TopBar";
import { GameCalendar } from "@/src/features/game/components/GameCalendar";
import { PlayerStatusPanel } from "@/src/features/game/components/PlayerStatusPanel";
import { DailyEventModal } from "../components/DailyEventModal";
import { GameLayout } from "@/src/features/game/components/GameLayout";
import { useNotifications } from "@/src/shared/hooks/useNotifications";
import { NotificationCenter } from "@/src/shared/components/NotificationCenter";
import { AppHeader } from "@/src/shared/components/AppHeader";
import { useAuth } from "@/containers/auth/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DailyRoutinePlan } from "@/src/features/game/hooks/useGameEngine";

function parseChoiceSummary(choiceMade: string) {
	const chunks = choiceMade.split("|").map((item) => item.trim());
	const read = (prefix: string) =>
		chunks
			.find((chunk) => chunk.toUpperCase().startsWith(prefix))
			?.split(":")[1] ?? "-";

	return {
		morning: read("MANHA:"),
		overtime: read("EXTRA:"),
		evening: read("NOITE:"),
		stress: read("STRESSGAIN:"),
	};
}

export function GameScreen() {
	const router = useRouter();
	const { user, isLoading: authLoading, logout, mutate } = useAuth();
	const characterNameInputId = useId();
	const professionSelectId = useId();
	const [characterName, setCharacterName] = useState("Jogador");
	const [professionId, setProfessionId] = useState(
		INITIAL_PROFESSIONS[0]?.id ?? "",
	);
	const [isEventModalMinimized, setIsEventModalMinimized] = useState(false);
	const [isTutorialOpen, setIsTutorialOpen] = useState(false);
	const [selectedPastDay, setSelectedPastDay] = useState<number | null>(null);
	const tutorialCardRef = useRef<HTMLDivElement | null>(null);
	const summaryCardRef = useRef<HTMLDivElement | null>(null);

	const {
		header,
		gameState,
		isLoading,
		isSubmitting,
		error,
		gameOver,
		hasActiveSession,
		logs,
		motivation,
		overtimeAvailable,
		stressDaysRemaining,
		startNewGame,
		playDailyRoutine,
	} = useGameEngine({
		userId: user?.id ?? 0,
	});

	const selectedLog = useMemo(() => {
		if (selectedPastDay === null) {
			return null;
		}

		return logs.find((log) => log.day === selectedPastDay) ?? null;
	}, [logs, selectedPastDay]);

	const notifications = useNotifications();

	const dateLabel = useMemo(
		() => `Dia ${header.currentDay}`,
		[header.currentDay],
	);

	useEffect(() => {
		if (!authLoading && !user) {
			router.replace("/login");
		}
	}, [authLoading, router, user]);

	useEffect(() => {
		if (gameState) {
			setIsEventModalMinimized(false);
		}
	}, [gameState]);

	useEffect(() => {
		if (!isTutorialOpen) {
			return;
		}

		const onMouseDown = (event: MouseEvent) => {
			if (!tutorialCardRef.current) {
				return;
			}

			if (!tutorialCardRef.current.contains(event.target as Node)) {
				setIsTutorialOpen(false);
			}
		};

		document.addEventListener("mousedown", onMouseDown);
		return () => {
			document.removeEventListener("mousedown", onMouseDown);
		};
	}, [isTutorialOpen]);

	useEffect(() => {
		if (!selectedLog) {
			return;
		}

		const onMouseDown = (event: MouseEvent) => {
			if (!summaryCardRef.current) {
				return;
			}

			if (!summaryCardRef.current.contains(event.target as Node)) {
				setSelectedPastDay(null);
			}
		};

		document.addEventListener("mousedown", onMouseDown);
		return () => {
			document.removeEventListener("mousedown", onMouseDown);
		};
	}, [selectedLog]);

	if (authLoading || isLoading) {
		return (
			<main className="flex min-h-screen items-center justify-center">
				<p className="text-sm text-muted-foreground">Carregando jogo...</p>
			</main>
		);
	}

	if (!user) {
		return null;
	}

	if (!hasActiveSession || !gameState) {
		return (
			<main className="min-h-screen bg-background p-4 text-foreground md:p-6">
				<div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
					<AppHeader
						user={user}
						onLogout={logout}
						onPlanUpdated={(planType) =>
							mutate(
								(current) =>
									current?.user
										? { user: { ...current.user, planType } }
										: current,
								false,
							)
						}
					/>
					<Card className="mx-auto w-full max-w-lg">
						<CardHeader>
							<CardTitle>Iniciar novo jogo</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							{error ? (
								<div className="rounded-md border border-destructive/30 bg-destructive/10 p-2 text-sm text-destructive">
									{error}
								</div>
							) : null}

							<div className="space-y-2">
								<label
									htmlFor={characterNameInputId}
									className="text-sm font-medium"
								>
									Nome do personagem
								</label>
								<Input
									id={characterNameInputId}
									value={characterName}
									onChange={(event) => setCharacterName(event.target.value)}
									placeholder="Digite o nome"
								/>
							</div>

							<div className="space-y-2">
								<label
									htmlFor={professionSelectId}
									className="text-sm font-medium"
								>
									Profissão
								</label>
								<select
									id={professionSelectId}
									value={professionId}
									onChange={(event) => setProfessionId(event.target.value)}
									className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
								>
									{INITIAL_PROFESSIONS.map((profession) => (
										<option key={profession.id} value={profession.id}>
											{profession.name} · Salário base R${" "}
											{profession.baseSalary}
										</option>
									))}
								</select>
							</div>

							<Button
								disabled={
									isSubmitting || !characterName.trim() || !professionId
								}
								onClick={async () => {
									const ok = await startNewGame(
										characterName.trim(),
										professionId,
									);
									if (ok) {
										notifications.notifySuccess("Jogo iniciado com sucesso.");
									}
								}}
								className="w-full"
							>
								{isSubmitting ? "Iniciando..." : "Começar jornada"}
							</Button>
						</CardContent>
					</Card>
				</div>
			</main>
		);
	}

	return (
		<>
			<NotificationCenter
				items={notifications.items}
				onDismiss={notifications.remove}
			/>
			<Button
				className="fixed bottom-4 right-4 z-50"
				variant="outline"
				onClick={() => setIsTutorialOpen(true)}
			>
				Tutorial
			</Button>
			{isTutorialOpen ? (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
					<Card
						ref={tutorialCardRef}
						className="max-h-[85vh] w-full max-w-2xl overflow-hidden"
					>
						<CardHeader className="flex flex-row items-start justify-between gap-3">
							<CardTitle>Como jogar FinQuest</CardTitle>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => setIsTutorialOpen(false)}
							>
								Fechar
							</Button>
						</CardHeader>
						<CardContent className="max-h-[70vh] space-y-4 overflow-y-auto pr-1 text-sm text-muted-foreground">
							<p>
								Cada dia é um turno com 3 etapas: manhã, possível hora extra e
								noite.
							</p>
							<ul className="list-disc space-y-1 pl-5">
								<li>
									Manhã: escolha entre trabalhar, lazer, faltar ou estudar.
								</li>
								<li>
									Hora extra: pode aparecer quando você trabalha pela manhã.
								</li>
								<li>
									Noite: escolha estudar, lazer ou dormir para fechar o dia.
								</li>
							</ul>
							<p>
								O desânimo cresce com o passar dos dias. Com motivação baixa,
								estudo e hora extra rendem menos. Use lazer para recuperar.
							</p>
							<p>
								Objetivo: equilibrar trabalho, estudo, lazer e investimentos
								para manter progresso sustentável.
							</p>
						</CardContent>
					</Card>
				</div>
			) : null}
			{error ? (
				<div className="fixed left-4 top-4 z-50 max-w-sm rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
					{error}
				</div>
			) : null}
			{selectedLog ? (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
					<Card ref={summaryCardRef} className="w-full max-w-lg">
						<CardHeader className="flex flex-row items-start justify-between gap-3">
							<CardTitle>Resumo do Dia {selectedLog.day}</CardTitle>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => setSelectedPastDay(null)}
							>
								Fechar
							</Button>
						</CardHeader>
						<CardContent className="space-y-3 text-sm">
							<p className="text-muted-foreground">{selectedLog.event_title}</p>
							{(() => {
								const summary = parseChoiceSummary(selectedLog.choice_made);
								return (
									<div className="space-y-1 rounded-md border border-border p-3">
										<p>
											<strong>Manhã:</strong> {summary.morning}
										</p>
										<p>
											<strong>Hora extra:</strong> {summary.overtime}
										</p>
										<p>
											<strong>Noite:</strong> {summary.evening}
										</p>
										<p>
											<strong>Estresse no dia:</strong>{" "}
											{summary.stress === "1" ? "Aumentou" : "Estável"}
										</p>
									</div>
								);
							})()}
						</CardContent>
					</Card>
				</div>
			) : null}
			<div className="mx-auto mt-4 w-full max-w-6xl px-4 md:px-6">
				<AppHeader
					user={user}
					onLogout={logout}
					onPlanUpdated={(planType) =>
						mutate(
							(current) =>
								current?.user
									? { user: { ...current.user, planType } }
									: current,
							false,
						)
					}
				/>
			</div>
			<GameLayout
				top={
					<TopBar
						dateLabel={dateLabel}
						playerName={header.playerName}
						professionName={header.professionName}
						money={header.money}
					/>
				}
				center={
					<GameCalendar
						day={gameState.day}
						logs={logs}
						onSelectPastDay={(dayValue) => setSelectedPastDay(dayValue)}
					/>
				}
				right={<PlayerStatusPanel state={gameState} />}
				modal={
					gameOver ? (
						<div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
							<Card className="w-full max-w-md">
								<CardHeader>
									<CardTitle>Jogo concluído</CardTitle>
								</CardHeader>
								<CardContent>
									<p className="mb-4 text-sm text-muted-foreground">
										Você chegou ao fim do calendário desta jornada.
									</p>
									<Button
										onClick={() => window.location.reload()}
										className="w-full"
									>
										Iniciar nova jornada
									</Button>
								</CardContent>
							</Card>
						</div>
					) : (
						<DailyEventModal
							key={gameState.day}
							day={gameState.day}
							isSubmitting={isSubmitting}
							motivationPercent={Math.round(motivation.factor * 100)}
							overtimeAvailable={overtimeAvailable}
							stressDaysRemaining={stressDaysRemaining}
							isMinimized={isEventModalMinimized}
							onMinimize={() => setIsEventModalMinimized(true)}
							onRestore={() => setIsEventModalMinimized(false)}
							onConfirm={async (plan: DailyRoutinePlan) => {
								const outcome = await playDailyRoutine(plan);
								if (!outcome) {
									return;
								}

								if (outcome.overtimeApplied) {
									notifications.notifyInfo("Hora extra concluída neste dia.");
								}

								notifications.notifySuccess(
									`Dia finalizado. Rendimento efetivo: ${Math.round(outcome.motivationFactor * 100)}% · Estresse ativo: ${outcome.nextStressDays} dia(s).`,
								);

								if (outcome.dayStory) {
									notifications.notifyInfo(outcome.dayStory);
								}
							}}
						/>
					)
				}
			/>
		</>
	);
}
