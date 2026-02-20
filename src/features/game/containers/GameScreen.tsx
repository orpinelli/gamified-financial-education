"use client";

import { useId, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useGameEngine } from "@/src/features/game/hooks/useGameEngine";
import { INITIAL_PROFESSIONS } from "@/src/features/game/data/professions";
import { TopBar } from "@/src/features/game/components/TopBar";
import { GameCalendar } from "@/src/features/game/components/GameCalendar";
import { PlayerStatusPanel } from "@/src/features/game/components/PlayerStatusPanel";
import { DailyEventModal } from "@/src/features/game/components/DailyEventModal";
import { GameLayout } from "@/src/features/game/components/GameLayout";
import { useNotifications } from "@/src/shared/hooks/useNotifications";
import { NotificationCenter } from "@/src/shared/components/NotificationCenter";
import { useAuth } from "@/containers/auth/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function GameScreen() {
	const router = useRouter();
	const { user, isLoading: authLoading } = useAuth();
	const characterNameInputId = useId();
	const professionSelectId = useId();
	const [characterName, setCharacterName] = useState("Jogador");
	const [professionId, setProfessionId] = useState(
		INITIAL_PROFESSIONS[0]?.id ?? "",
	);

	const {
		header,
		gameState,
		currentEvent,
		isLoading,
		isSubmitting,
		error,
		gameOver,
		hasActiveSession,
		startNewGame,
		playTurn,
	} = useGameEngine({
		userId: user?.id ?? 0,
	});

	const notifications = useNotifications();

	const dateLabel = useMemo(
		() => `Dia ${header.currentDay}`,
		[header.currentDay],
	);

	if (authLoading || isLoading) {
		return (
			<main className="flex min-h-screen items-center justify-center">
				<p className="text-sm text-muted-foreground">Carregando jogo...</p>
			</main>
		);
	}

	if (!user) {
		router.push("/login");
		return null;
	}

	if (!hasActiveSession || !gameState || !currentEvent) {
		return (
			<main className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
				<Card className="w-full max-w-lg">
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
										{profession.name} · Salário base R$ {profession.baseSalary}
									</option>
								))}
							</select>
						</div>

						<Button
							disabled={isSubmitting || !characterName.trim() || !professionId}
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
			</main>
		);
	}

	return (
		<>
			<NotificationCenter
				items={notifications.items}
				onDismiss={notifications.remove}
			/>
			<GameLayout
				top={
					<TopBar
						dateLabel={dateLabel}
						playerName={header.playerName}
						professionName={header.professionName}
						money={header.money}
					/>
				}
				center={<GameCalendar day={gameState.day} />}
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
							event={currentEvent}
							onChoose={async (option) => {
								const roll = await playTurn(option);
								if (option.diceCount > 0 && roll) {
									notifications.notifyInfo(
										`Rolagem: [${roll.values.join(", ")}] total ${roll.total}`,
									);
								} else {
									notifications.notifySuccess(`Ação aplicada: ${option.label}`);
								}
							}}
						/>
					)
				}
			/>
		</>
	);
}
