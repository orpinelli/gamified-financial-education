"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SessionSummary } from "@/src/features/game/hooks/useGameEngine";

interface NewGameConfirmDialogProps {
	activeSession: SessionSummary;
	onConfirm: () => void;
	onCancel: () => void;
}

export function NewGameConfirmDialog({
	activeSession,
	onConfirm,
	onCancel,
}: NewGameConfirmDialogProps) {
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle className="text-lg">⚠️ Iniciar nova jornada?</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<p className="text-sm text-muted-foreground">
						Você tem uma jornada ativa com{" "}
						<span className="font-semibold text-foreground">
							{activeSession.character_name}
						</span>{" "}
						no dia{" "}
						<span className="font-semibold text-foreground">
							{activeSession.current_day}/365
						</span>
						.
					</p>
					<p className="text-sm text-muted-foreground">
						Criar uma nova jornada vai <strong>encerrar o jogo atual</strong>.
						Você ainda poderá ver o resultado dela no lobby.
					</p>
					<div className="flex gap-2">
						<Button
							className="flex-1"
							variant="destructive"
							onClick={onConfirm}
						>
							Encerrar e começar nova
						</Button>
						<Button className="flex-1" variant="outline" onClick={onCancel}>
							Cancelar
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
