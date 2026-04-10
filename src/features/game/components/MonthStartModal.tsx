"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

const MONTH_NAMES = [
	"Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
	"Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const LIFESTYLE_OPTIONS = [
	{ level: 1, label: "Econômico extremo", desc: "Corta tudo ao máximo", happinessDelta: -20, emoji: "🪙" },
	{ level: 2, label: "Bem simples", desc: "Poucos gastos extras", happinessDelta: -10, emoji: "🛒" },
	{ level: 3, label: "Básico", desc: "Padrão equilibrado", happinessDelta: 0, emoji: "🏠" },
	{ level: 4, label: "Confortável", desc: "Alguns luxos moderados", happinessDelta: 5, emoji: "🛋️" },
	{ level: 5, label: "Bem confortável", desc: "Estilo de vida elevado", happinessDelta: 10, emoji: "🌟" },
	{ level: 6, label: "Luxo", desc: "Alto padrão, risco ao crédito", happinessDelta: 15, emoji: "💎" },
	{ level: 7, label: "Ostentação", desc: "Máximo padrão, crédito sofre muito", happinessDelta: 20, emoji: "👑" },
];

export type MonthStartData = {
	lifestyleLevel: number;
	budgetIncomeExpected: number;
	budgetFixedExpenses: number;
	budgetEmergencyReserve: number;
	budgetSavingsGoal: number;
};

interface MonthStartModalProps {
	open: boolean;
	month: number;
	currentMoney: number;
	onConfirm: (data: MonthStartData) => Promise<void>;
}

export function MonthStartModal({
	open,
	month,
	currentMoney,
	onConfirm,
}: MonthStartModalProps) {
	const [step, setStep] = useState<1 | 2>(1);
	const [lifestyleLevel, setLifestyleLevel] = useState(3);
	const [budgetIncome, setBudgetIncome] = useState("2000");
	const [budgetFixed, setBudgetFixed] = useState("800");
	const [budgetEmergency, setBudgetEmergency] = useState("200");
	const [budgetSavings, setBudgetSavings] = useState("200");
	const [submitting, setSubmitting] = useState(false);

	const monthName = MONTH_NAMES[(month - 1) % 12];

	async function handleConfirm() {
		setSubmitting(true);
		try {
			await onConfirm({
				lifestyleLevel,
				budgetIncomeExpected: Number(budgetIncome) || 0,
				budgetFixedExpenses: Number(budgetFixed) || 0,
				budgetEmergencyReserve: Number(budgetEmergency) || 0,
				budgetSavingsGoal: Number(budgetSavings) || 0,
			});
		} finally {
			setSubmitting(false);
			setStep(1);
		}
	}

	return (
		<Dialog open={open}>
			<DialogContent className="max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
				<DialogHeader>
					<DialogTitle>
						{step === 1 ? `Início de ${monthName}` : `Orçamento — ${monthName}`}
					</DialogTitle>
				</DialogHeader>

				{step === 1 && (
					<div className="space-y-4">
						<p className="text-sm text-muted-foreground">
							Qual será seu padrão de vida este mês?
						</p>
						<p className="text-sm font-medium">
							Saldo atual: R$ {currentMoney.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
						</p>

						<div className="space-y-2">
							{LIFESTYLE_OPTIONS.map((opt) => (
								<button
									key={opt.level}
									type="button"
									onClick={() => setLifestyleLevel(opt.level)}
									className={[
										"flex w-full items-center gap-3 rounded-lg border-2 p-3 text-left text-sm transition-colors",
										lifestyleLevel === opt.level
											? "border-primary bg-primary/10"
											: "border-border hover:border-primary/50",
									].join(" ")}
								>
									<span className="text-xl">{opt.emoji}</span>
									<div className="flex-1">
										<p className="font-medium">{opt.label}</p>
										<p className="text-xs text-muted-foreground">{opt.desc}</p>
									</div>
									<span
										className={[
											"text-xs font-semibold",
											opt.happinessDelta > 0
												? "text-green-600"
												: opt.happinessDelta < 0
													? "text-red-600"
													: "text-muted-foreground",
										].join(" ")}
									>
										{opt.happinessDelta > 0 ? "+" : ""}
										{opt.happinessDelta !== 0 ? `${opt.happinessDelta} 😊` : "neutro"}
									</span>
								</button>
							))}
						</div>

						<Button className="w-full" onClick={() => setStep(2)}>
							Próximo: Orçamento
						</Button>
					</div>
				)}

				{step === 2 && (
					<div className="space-y-4">
						<p className="text-sm text-muted-foreground">
							Planeje seu orçamento para {monthName}. Isso ajudará a avaliar seu desempenho ao final do mês.
						</p>

						{[
							{ label: "Expectativa de receitas (R$)", value: budgetIncome, set: setBudgetIncome },
							{ label: "Gastos fixos esperados (R$)", value: budgetFixed, set: setBudgetFixed },
							{ label: "Reserva para imprevistos (R$)", value: budgetEmergency, set: setBudgetEmergency },
							{ label: "Meta de poupança (R$)", value: budgetSavings, set: setBudgetSavings },
						].map(({ label, value, set }) => (
							<div key={label} className="space-y-1">
								<label className="text-sm font-medium">{label}</label>
								<Input
									type="number"
									min={0}
									value={value}
									onChange={(e) => set(e.target.value)}
									className="text-right"
								/>
							</div>
						))}

						<div className="flex gap-2">
							<Button variant="outline" onClick={() => setStep(1)} className="flex-1">
								Voltar
							</Button>
							<Button
								className="flex-1"
								disabled={submitting}
								onClick={() => void handleConfirm()}
							>
								{submitting ? "Salvando..." : "Começar mês"}
							</Button>
						</div>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}
