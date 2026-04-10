"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

const SLIDES = [
	{
		emoji: "🎯",
		title: "Objetivo",
		body: "Viva um ano de decisões financeiras! Seu objetivo é chegar ao dia 365 com o maior score possível, equilibrando dinheiro, felicidade e conhecimento.",
	},
	{
		emoji: "📅",
		title: "O Tabuleiro",
		body: "O tabuleiro é o calendário do ano. Cada casa é um dia. Você avança pelo calendário a cada turno — o avatar se move automaticamente após girar a roleta.",
	},
	{
		emoji: "🎰",
		title: "A Roleta",
		body: "Gire a roleta para avançar 1, 2 ou 3 dias. Cada parada pode trazer uma carta de evento: boa, ruim, uma decisão ou uma compra impulsiva.",
	},
	{
		emoji: "📊",
		title: "Suas Variáveis",
		body: "💰 Dinheiro — seu saldo atual.\n😊 Felicidade — qualidade de vida (0-100).\n📚 Conhecimento — educação financeira acumulada.\n💳 Score de Crédito — sua reputação financeira (0-1000).",
	},
	{
		emoji: "💸",
		title: "O Salário",
		body: "Você trabalha no Escritório e recebe R$ 2.000 todo dia 1 do mês. Use bem! Ao começar um novo mês, você escolherá seu padrão de vida e planejará o orçamento.",
	},
	{
		emoji: "🚀",
		title: "Pronto!",
		body: "Tome boas decisões, evite compras impulsivas e planeje seu orçamento. Quanto mais equilibrado for seu estilo de vida, maior será seu score final. Bora começar!",
	},
];

interface TutorialModalProps {
	open: boolean;
	onClose: () => void;
}

export function TutorialModal({ open, onClose }: TutorialModalProps) {
	const [slide, setSlide] = useState(0);

	const current = SLIDES[slide];
	const isLast = slide === SLIDES.length - 1;

	function handleNext() {
		if (isLast) {
			setSlide(0);
			onClose();
		} else {
			setSlide((s) => s + 1);
		}
	}

	return (
		<Dialog
			open={open}
			onOpenChange={(o) => {
				if (!o) {
					setSlide(0);
					onClose();
				}
			}}
		>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2 text-xl">
						<span>{current?.emoji}</span>
						<span>{current?.title}</span>
					</DialogTitle>
				</DialogHeader>

				<div className="min-h-[100px] py-2 text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
					{current?.body}
				</div>

				{/* Dots */}
				<div className="flex items-center justify-center gap-1.5 py-2">
					{SLIDES.map((_, i) => (
						<button
							key={i}
							type="button"
							onClick={() => setSlide(i)}
							className={[
								"h-2 rounded-full transition-all",
								i === slide ? "w-6 bg-primary" : "w-2 bg-muted-foreground/30",
							].join(" ")}
						/>
					))}
				</div>

				<div className="flex justify-between gap-2">
					<Button
						variant="ghost"
						size="sm"
						onClick={() => {
							setSlide(0);
							onClose();
						}}
					>
						Pular
					</Button>
					<div className="flex gap-2">
						{slide > 0 && (
							<Button
								variant="outline"
								size="sm"
								onClick={() => setSlide((s) => s - 1)}
							>
								Anterior
							</Button>
						)}
						<Button size="sm" onClick={handleNext}>
							{isLast ? "Começar!" : "Próximo"}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
