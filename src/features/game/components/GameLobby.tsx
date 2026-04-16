"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SessionSummary } from "@/src/features/game/hooks/useGameEngine";

interface GameLobbyProps {
	sessions: SessionSummary[];
	isDeleting?: boolean;
	onContinue: (id: number) => void;
	onViewResult: (id: number) => void;
	onNewGame: () => void;
	onDelete: (id: number) => void;
}

function avatarEmoji(hair: string, happiness: number): string {
	if (happiness >= 70) return "😄";
	if (happiness >= 40) return "😐";
	return "😞";
}

function formatMoney(value: number): string {
	return Number(value).toLocaleString("pt-BR", {
		style: "currency",
		currency: "BRL",
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	});
}

function formatDate(dateStr: string): string {
	return new Date(dateStr).toLocaleDateString("pt-BR", {
		day: "2-digit",
		month: "2-digit",
		year: "2-digit",
	});
}

export function GameLobby({
	sessions,
	isDeleting,
	onContinue,
	onViewResult,
	onNewGame,
	onDelete,
}: GameLobbyProps) {
	const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

	const activeSession = sessions.find((s) => s.status === "ACTIVE");
	const completedSessions = sessions.filter((s) => s.status === "COMPLETED");

	return (
		<div className="mx-auto w-full max-w-2xl space-y-4">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Suas Jornadas</h1>
					<p className="text-sm text-muted-foreground">
						Escolha uma jornada para continuar ou inicie uma nova
					</p>
				</div>
				<Button onClick={onNewGame} size="sm">
					+ Nova Jornada
				</Button>
			</div>

			{sessions.length === 0 && (
				<Card className="text-center">
					<CardContent className="py-12">
						<p className="mb-2 text-4xl">🎮</p>
						<p className="font-semibold">Nenhuma jornada encontrada</p>
						<p className="mb-6 mt-1 text-sm text-muted-foreground">
							Comece sua primeira jornada financeira!
						</p>
						<Button onClick={onNewGame}>Iniciar primeira jornada</Button>
					</CardContent>
				</Card>
			)}

			{activeSession && (
				<div className="space-y-2">
					<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
						Em andamento
					</p>
					<SessionCard
						session={activeSession}
						confirmDeleteId={confirmDeleteId}
						isDeleting={isDeleting}
						onAction={() => onContinue(activeSession.id)}
						actionLabel="Continuar →"
						onDelete={setConfirmDeleteId}
						onConfirmDelete={onDelete}
						onCancelDelete={() => setConfirmDeleteId(null)}
					/>
				</div>
			)}

			{completedSessions.length > 0 && (
				<div className="space-y-2">
					<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
						Concluídas
					</p>
					{completedSessions.map((s) => (
						<SessionCard
							key={s.id}
							session={s}
							confirmDeleteId={confirmDeleteId}
							isDeleting={isDeleting}
							onAction={() => onViewResult(s.id)}
							actionLabel="Ver resultado"
							onDelete={setConfirmDeleteId}
							onConfirmDelete={onDelete}
							onCancelDelete={() => setConfirmDeleteId(null)}
						/>
					))}
				</div>
			)}
		</div>
	);
}

interface SessionCardProps {
	session: SessionSummary;
	confirmDeleteId: number | null;
	isDeleting?: boolean;
	onAction: () => void;
	actionLabel: string;
	onDelete: (id: number) => void;
	onConfirmDelete: (id: number) => void;
	onCancelDelete: () => void;
}

function SessionCard({
	session,
	confirmDeleteId,
	isDeleting,
	onAction,
	actionLabel,
	onDelete,
	onConfirmDelete,
	onCancelDelete,
}: SessionCardProps) {
	const isActive = session.status === "ACTIVE";
	const face = avatarEmoji(session.avatar_hair, Number(session.happiness));
	const progress = Math.round((Number(session.current_day) / 365) * 100);
	const isConfirmingDelete = confirmDeleteId === session.id;

	return (
		<Card className={isActive ? "border-primary/40 bg-primary/5" : ""}>
			<CardHeader className="pb-2 pt-3">
				<div className="flex items-start justify-between">
					<div className="flex items-center gap-3">
						<span className="text-3xl">{face}</span>
						<div>
							<div className="flex items-center gap-2">
								<CardTitle className="text-base">
									{session.character_name}
								</CardTitle>
								<span
									className={`rounded-full px-2 py-0.5 text-xs font-medium ${
										isActive
											? "bg-green-100 text-green-700"
											: "bg-muted text-muted-foreground"
									}`}
								>
									{isActive ? "🟢 Ativo" : "✓ Concluído"}
								</span>
							</div>
							<p className="text-xs text-muted-foreground">
								Atualizado em {formatDate(session.updated_at)}
							</p>
						</div>
					</div>
					<button
						onClick={() => onDelete(session.id)}
						className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
						title="Excluir jornada"
					>
						🗑️
					</button>
				</div>
			</CardHeader>
			<CardContent className="space-y-3 pb-3">
				{/* Progress bar */}
				<div>
					<div className="mb-1 flex justify-between text-xs text-muted-foreground">
						<span>Dia {session.current_day} / 365</span>
						<span>{progress}%</span>
					</div>
					<div className="h-2 overflow-hidden rounded-full bg-muted">
						<div
							className="h-full rounded-full bg-primary transition-all"
							style={{ width: `${progress}%` }}
						/>
					</div>
				</div>

				{/* Stats grid */}
				<div className="grid grid-cols-4 gap-2 text-center text-sm">
					<div className="rounded-lg border border-border bg-background p-2">
						<p className="text-xs text-muted-foreground">💰 Dinheiro</p>
						<p
							className={`font-semibold ${Number(session.money) < 0 ? "text-destructive" : "text-green-600"}`}
						>
							{formatMoney(Number(session.money))}
						</p>
					</div>
					<div className="rounded-lg border border-border bg-background p-2">
						<p className="text-xs text-muted-foreground">😊 Felicidade</p>
						<p className="font-semibold">{session.happiness}/100</p>
					</div>
					<div className="rounded-lg border border-border bg-background p-2">
						<p className="text-xs text-muted-foreground">📚 Conhecimento</p>
						<p className="font-semibold">{session.knowledge}/100</p>
					</div>
					<div className="rounded-lg border border-border bg-background p-2">
						<p className="text-xs text-muted-foreground">💳 Crédito</p>
						<p className="font-semibold">{session.credit_score}</p>
					</div>
				</div>

				{/* Actions */}
				{isConfirmingDelete ? (
					<div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-2 text-sm">
						<p className="flex-1 text-destructive">Excluir esta jornada?</p>
						<Button
							size="sm"
							variant="destructive"
							disabled={isDeleting}
							onClick={() => onConfirmDelete(session.id)}
						>
							{isDeleting ? "Excluindo..." : "Excluir"}
						</Button>
						<Button size="sm" variant="ghost" onClick={onCancelDelete}>
							Cancelar
						</Button>
					</div>
				) : (
					<Button className="w-full" size="sm" onClick={onAction}>
						{actionLabel}
					</Button>
				)}
			</CardContent>
		</Card>
	);
}
