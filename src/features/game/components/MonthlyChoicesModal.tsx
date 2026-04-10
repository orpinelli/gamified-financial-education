"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	type ChoiceLevel,
	defaultChoices,
	MONTHLY_CHOICE_CARDS,
} from "@/lib/monthly-choices";

const MONTH_NAMES = [
	"Janeiro",
	"Fevereiro",
	"Março",
	"Abril",
	"Maio",
	"Junho",
	"Julho",
	"Agosto",
	"Setembro",
	"Outubro",
	"Novembro",
	"Dezembro",
];

interface MonthlyChoicesModalProps {
	open: boolean;
	month: number;
	initialChoices: Record<string, string>;
	onConfirm: (choices: Record<string, string>) => void;
}

export function MonthlyChoicesModal({
	open,
	month,
	initialChoices,
	onConfirm,
}: MonthlyChoicesModalProps) {
	const [cardIndex, setCardIndex] = useState(0);
	const [choices, setChoices] = useState<Record<string, string>>(() => ({
		...defaultChoices(),
		...initialChoices,
	}));

	// Reset card index and apply initialChoices every time modal opens
	useEffect(() => {
		if (open) {
			setCardIndex(0);
			setChoices({ ...defaultChoices(), ...initialChoices });
		}
	}, [open, initialChoices]);

	const card = MONTHLY_CHOICE_CARDS[cardIndex];
	const currentChoice = card
		? (choices[card.key] as ChoiceLevel | undefined)
		: undefined;
	const isLast = cardIndex === MONTHLY_CHOICE_CARDS.length - 1;
	const monthName = MONTH_NAMES[(month - 1) % 12] ?? `Mês ${month}`;
	const total = MONTHLY_CHOICE_CARDS.length;

	if (!card) return null;

	function selectLevel(level: ChoiceLevel) {
		setChoices((prev) => ({ ...prev, [card.key]: level }));
	}

	function handleNext() {
		if (!currentChoice) return;
		if (isLast) {
			onConfirm(choices);
		} else {
			setCardIndex((i) => i + 1);
		}
	}

	function handleBack() {
		if (cardIndex > 0) setCardIndex((i) => i - 1);
	}

	return (
		<Dialog open={open}>
			<DialogContent
				className="max-w-sm max-h-[90vh] overflow-y-auto"
				onPointerDownOutside={(e) => e.preventDefault()}
				onEscapeKeyDown={(e) => e.preventDefault()}
			>
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<span>📅</span>
						<span>Escolhas de {monthName}</span>
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-4">
					{/* Progress bar */}
					<div className="flex items-center gap-1">
						{MONTHLY_CHOICE_CARDS.map((c, i) => (
							<div
								key={c.key}
								className={[
									"h-1.5 flex-1 rounded-full transition-all duration-300",
									i < cardIndex
										? "bg-primary"
										: i === cardIndex
											? "bg-primary/60"
											: "bg-muted",
								].join(" ")}
							/>
						))}
					</div>
					<p className="text-xs text-right text-muted-foreground">
						{cardIndex + 1} / {total}
					</p>

					{/* Card header */}
					<div className="flex items-center gap-3">
						<span className="text-3xl">{card.emoji}</span>
						<div>
							<p className="font-semibold">{card.title}</p>
							<p className="text-sm text-muted-foreground leading-snug">
								{card.prompt}
							</p>
						</div>
					</div>

					{/* Level options */}
					<div className="space-y-2">
						{card.options.map((opt) => {
							const isSelected = currentChoice === opt.level;
							return (
								<button
									key={opt.level}
									type="button"
									onClick={() => selectLevel(opt.level)}
									className={[
										"flex w-full items-start gap-3 rounded-lg border-2 p-3 text-left text-sm transition-colors",
										isSelected
											? "border-primary bg-primary/10"
											: "border-border hover:border-primary/40",
									].join(" ")}
								>
									<span className="mt-0.5 text-xl shrink-0">
										{opt.levelEmoji}
									</span>
									<div className="flex-1 min-w-0">
										<p className="font-medium">{opt.label}</p>
										<p className="text-xs text-muted-foreground">
											{opt.description}
										</p>
										{opt.note && (
											<p className="mt-0.5 text-xs text-muted-foreground/70 italic">
												{opt.note}
											</p>
										)}
									</div>
									<div className="shrink-0 text-right space-y-0.5 pl-1">
										<p
											className={[
												"text-xs font-semibold tabular-nums",
												opt.money < 0
													? "text-red-600"
													: opt.money === 0
														? "text-muted-foreground"
														: "text-green-600",
											].join(" ")}
										>
											{opt.money < 0
												? `-R$\u00a0${Math.abs(opt.money)}`
												: opt.money === 0
													? "Grátis"
													: `+R$\u00a0${opt.money}`}
										</p>
										<p
											className={[
												"text-xs tabular-nums",
												opt.happiness > 0
													? "text-green-600"
													: opt.happiness < 0
														? "text-red-600"
														: "text-muted-foreground",
											].join(" ")}
										>
											{opt.happiness > 0 ? `+${opt.happiness}` : opt.happiness}
											😊
										</p>
									</div>
								</button>
							);
						})}
					</div>

					{/* Navigation */}
					<div className="flex gap-2">
						{cardIndex > 0 && (
							<Button variant="outline" onClick={handleBack} className="flex-1">
								← Voltar
							</Button>
						)}
						<Button
							className="flex-1"
							disabled={!currentChoice}
							onClick={handleNext}
						>
							{isLast ? "Confirmar escolhas ✓" : "Próximo →"}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
