"use client";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

export type MonthSummaryData = {
	monthName: string;
	month: number;
	totalMoneyIn: number;
	totalMoneyOut: number;
	actualSavings: number;
	savingsGoal: number | null;
	savingsPercent: number | null;
	avgHappiness: number;
	creditScore: number;
	impulseScore: number;
	impulsePurchases: number;
	profile: string;
	logsCount: number;
};

const PROFILE_EMOJI: Record<string, string> = {
	"Gastador Impulsivo": "🛒",
	Equilibrado: "⚖️",
	"Planejador Emocional": "🧠",
};

const PROFILE_FEEDBACK: Record<string, string> = {
	"Gastador Impulsivo":
		"Cuidado com as compras por impulso! Elas parecem satisfatórias no momento, mas comprometem seu orçamento no longo prazo.",
	Equilibrado:
		"Você manteve um equilíbrio razoável. Com um pouco mais de planejamento, pode melhorar ainda mais seus resultados.",
	"Planejador Emocional":
		"Excelente! Você resistiu às tentações e tomou decisões conscientes. Continue assim e seu score de crédito só vai subir.",
};

interface MonthEndSummaryProps {
	open: boolean;
	data: MonthSummaryData | null;
	onClose: () => void;
}

function ProgressBar({ percent }: { percent: number }) {
	const clamped = Math.min(100, Math.max(0, percent));
	return (
		<div className="h-3 w-full overflow-hidden rounded-full bg-muted">
			<div
				className="h-full rounded-full bg-primary transition-all duration-700"
				style={{ width: `${clamped}%` }}
			/>
		</div>
	);
}

export function MonthEndSummary({ open, data, onClose }: MonthEndSummaryProps) {
	if (!data) return null;

	const profileEmoji = PROFILE_EMOJI[data.profile] ?? "🧑";
	const profileFeedback = PROFILE_FEEDBACK[data.profile] ?? "";

	return (
		<Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
			<DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<span>📅</span>
						<span>Resumo de {data.monthName}</span>
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-5 text-sm">
					{/* Financeiro */}
					<section className="space-y-2">
						<h3 className="font-semibold flex items-center gap-1">💳 Financeiro</h3>
						<div className="grid grid-cols-2 gap-2 rounded-lg border border-border p-3">
							<div>
								<p className="text-xs text-muted-foreground">Receitas</p>
								<p className="font-medium text-green-600">
									+R$ {data.totalMoneyIn.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
								</p>
							</div>
							<div>
								<p className="text-xs text-muted-foreground">Gastos</p>
								<p className="font-medium text-red-600">
									-R$ {data.totalMoneyOut.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
								</p>
							</div>
							<div>
								<p className="text-xs text-muted-foreground">Poupança real</p>
								<p className="font-medium">
									R$ {data.actualSavings.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
								</p>
							</div>
							<div>
								<p className="text-xs text-muted-foreground">Compras impulsivas</p>
								<p className="font-medium">{data.impulsePurchases}x</p>
							</div>
						</div>
					</section>

					{/* Meta de Poupança */}
					{data.savingsGoal != null && data.savingsGoal > 0 && (
						<section className="space-y-2">
							<h3 className="font-semibold flex items-center gap-1">🎯 Meta de Poupança</h3>
							<div className="space-y-1 rounded-lg border border-border p-3">
								<div className="flex justify-between text-xs text-muted-foreground">
									<span>
										Meta: R$ {data.savingsGoal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
									</span>
									<span>{data.savingsPercent ?? 0}%</span>
								</div>
								<ProgressBar percent={data.savingsPercent ?? 0} />
							</div>
						</section>
					)}

					{/* Score de Crédito */}
					<section className="space-y-2">
						<h3 className="font-semibold flex items-center gap-1">📊 Score de Crédito</h3>
						<div className="space-y-1 rounded-lg border border-border p-3">
							<div className="flex justify-between text-xs text-muted-foreground">
								<span>Score atual</span>
								<span className="font-medium text-foreground">{data.creditScore} pts</span>
							</div>
							<ProgressBar percent={(data.creditScore / 1000) * 100} />
							<p className="text-xs text-muted-foreground">
								{data.creditScore >= 800
									? "Excelente"
									: data.creditScore >= 600
										? "Bom"
										: data.creditScore >= 400
											? "Regular"
											: "Ruim"}
							</p>
						</div>
					</section>

					{/* Qualidade de Vida */}
					<section className="space-y-2">
						<h3 className="font-semibold flex items-center gap-1">💛 Qualidade de Vida</h3>
						<div className="space-y-1 rounded-lg border border-border p-3">
							<div className="flex justify-between text-xs text-muted-foreground">
								<span>Felicidade média</span>
								<span className="font-medium text-foreground">{data.avgHappiness > 0 ? `+${data.avgHappiness}` : data.avgHappiness} pts</span>
							</div>
						</div>
					</section>

					{/* Perfil */}
					<section className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
						<div className="flex items-center gap-2">
							<span className="text-2xl">{profileEmoji}</span>
							<div>
								<p className="text-xs text-muted-foreground">Perfil do mês</p>
								<p className="font-bold">{data.profile}</p>
							</div>
						</div>
						<p className="text-xs text-muted-foreground leading-relaxed">{profileFeedback}</p>
					</section>

					<Button className="w-full" onClick={onClose}>
						Continuar jogando
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
