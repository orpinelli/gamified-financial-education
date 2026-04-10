"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

export type CardOption = {
	label: string;
	money_now: number;
	happiness_now: number;
	knowledge_now: number;
	money_later: number;
	happiness_later: number;
	is_deferred: boolean;
};

export type GameCard = {
	id: number;
	category: "BOM" | "RUIM" | "DECISAO" | "COMPRA_IMPULSIVA";
	emoji: string;
	title: string;
	description: string;
	money_effect: number;
	happiness_effect: number;
	knowledge_effect: number;
	score_effect: number;
	options: CardOption[] | null;
	deferred_money_effect: number;
	deferred_happiness_effect: number;
};

const CATEGORY_STYLES: Record<string, { bg: string; border: string; label: string }> = {
	BOM: {
		bg: "bg-green-50 dark:bg-green-950",
		border: "border-green-400",
		label: "Boa Notícia",
	},
	RUIM: {
		bg: "bg-red-50 dark:bg-red-950",
		border: "border-red-400",
		label: "Má Notícia",
	},
	DECISAO: {
		bg: "bg-blue-50 dark:bg-blue-950",
		border: "border-blue-400",
		label: "Decisão",
	},
	COMPRA_IMPULSIVA: {
		bg: "bg-orange-50 dark:bg-orange-950",
		border: "border-orange-500",
		label: "Compra Impulsiva!",
	},
};

function EffectBadge({ value, unit }: { value: number; unit: string }) {
	if (value === 0) return null;
	return (
		<span
			className={[
				"inline-block rounded-full px-2 py-0.5 text-xs font-semibold",
				value > 0
					? "bg-green-100 text-green-700"
					: "bg-red-100 text-red-700",
			].join(" ")}
		>
			{value > 0 ? "+" : ""}
			{value} {unit}
		</span>
	);
}

interface CardRevealProps {
	card: GameCard | null;
	onChoice: (choiceIndex: number | null) => void;
}

export function CardReveal({ card, onChoice }: CardRevealProps) {
	const [flipped, setFlipped] = useState(false);
	const [selectedOption, setSelectedOption] = useState<number | null>(null);

	const open = Boolean(card);

	function handleOpen(isOpen: boolean) {
		if (isOpen) {
			// Trigger flip on open
			setTimeout(() => setFlipped(true), 50);
		} else {
			setFlipped(false);
			setSelectedOption(null);
		}
	}

	if (!card) return null;

	const style = CATEGORY_STYLES[card.category] ?? CATEGORY_STYLES.BOM;
	const hasOptions =
		(card.category === "DECISAO" || card.category === "COMPRA_IMPULSIVA") &&
		card.options &&
		card.options.length > 0;

	function handleConfirm() {
		if (hasOptions) {
			onChoice(selectedOption);
		} else {
			onChoice(null);
		}
		setFlipped(false);
		setSelectedOption(null);
	}

	const isImpulsive = card.category === "COMPRA_IMPULSIVA";

	return (
		<Dialog open={open} onOpenChange={handleOpen}>
			<DialogContent className={`max-w-sm border-2 ${style.border} ${style.bg}`}>
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<span className="text-2xl">{card.emoji}</span>
						<div>
							<p className="text-xs font-normal uppercase tracking-wide opacity-60">
								{style.label}
							</p>
							<p className="text-base font-bold">{card.title}</p>
						</div>
					</DialogTitle>
				</DialogHeader>

				<p className="text-sm text-muted-foreground">{card.description}</p>

				{/* Simple card effects (BOM / RUIM) */}
				{!hasOptions && (
					<div className="flex flex-wrap gap-1.5">
						<EffectBadge value={card.money_effect} unit="R$" />
						<EffectBadge value={card.happiness_effect} unit="😊" />
						<EffectBadge value={card.knowledge_effect} unit="📚" />
						<EffectBadge value={card.score_effect} unit="crédito" />
					</div>
				)}

				{/* Decision / Impulsive options */}
				{hasOptions && card.options && (
					<div className="space-y-2">
						{card.options.map((opt, i) => (
							<button
								key={i}
								type="button"
								onClick={() => setSelectedOption(i)}
								className={[
									"w-full rounded-lg border-2 p-3 text-left text-sm transition-all",
									selectedOption === i
										? isImpulsive
											? "border-orange-500 bg-orange-100 dark:bg-orange-900"
											: "border-primary bg-primary/10"
										: "border-border hover:border-primary/50",
								].join(" ")}
							>
								<p className="font-medium">{opt.label}</p>
								<div className="mt-1 flex flex-wrap gap-1">
									{opt.money_now !== 0 && (
										<EffectBadge value={opt.money_now} unit="R$ agora" />
									)}
									{opt.happiness_now !== 0 && (
										<EffectBadge value={opt.happiness_now} unit="😊" />
									)}
									{opt.knowledge_now !== 0 && (
										<EffectBadge value={opt.knowledge_now} unit="📚" />
									)}
									{opt.is_deferred && opt.money_later !== 0 && (
										<span className="inline-block rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700">
											{opt.money_later > 0 ? "+" : ""}
											{opt.money_later} R$ depois
										</span>
									)}
								</div>
							</button>
						))}
					</div>
				)}

				{isImpulsive && (
					<p className="text-xs text-orange-600 font-medium">
						Atenção: compras impulsivas podem ter consequências no próximo turno!
					</p>
				)}

				<Button
					className="w-full"
					disabled={hasOptions ? selectedOption === null : false}
					onClick={handleConfirm}
					variant={isImpulsive ? "default" : "default"}
				>
					{hasOptions
						? selectedOption === null
							? "Escolha uma opção"
							: "Confirmar"
						: "Continuar"}
				</Button>
			</DialogContent>
		</Dialog>
	);
}
