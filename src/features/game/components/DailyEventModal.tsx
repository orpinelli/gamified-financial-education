import { useEffect, useMemo, useRef, useState } from "react";
import type {
	DailyRoutinePlan,
	EveningAction,
	MorningAction,
} from "@/src/features/game/hooks/useGameEngine";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type RoutineStage = "MANHA" | "JORNADA" | "NOITE" | "RESUMO";

interface JourneyResult {
	story: string;
	energyDelta: number;
	happinessDelta: number;
	stressGain: boolean;
}

interface DailyEventModalProps {
	day: number;
	isSubmitting: boolean;
	motivationPercent: number;
	overtimeAvailable: boolean;
	stressDaysRemaining: number;
	onConfirm: (plan: DailyRoutinePlan) => Promise<void>;
	isMinimized: boolean;
	onMinimize: () => void;
	onRestore: () => void;
}

const MORNING_OPTIONS: Array<{
	id: MorningAction;
	label: string;
	hint: string;
}> = [
	{
		id: "TRABALHAR",
		label: "Ir trabalhar",
		hint: "Gera renda base e consome energia.",
	},
	{
		id: "LAZER",
		label: "Fazer lazer",
		hint: "Recupera felicidade e reduz o desânimo. (Conta como falta)",
	},
	{
		id: "ESTUDAR",
		label: "Estudar pela manhã",
		hint: "Aumenta conhecimento com custo de energia. (Conta como falta)",
	},
];

const EVENING_OPTIONS: Array<{
	id: EveningAction;
	label: string;
	hint: string;
}> = [
	{
		id: "ESTUDAR",
		label: "Estudar",
		hint: "Rende menos com desânimo/estresse alto.",
	},
	{
		id: "LAZER",
		label: "Lazer",
		hint: "Melhora humor e limpa estresse acumulado.",
	},
	{
		id: "DORMIR",
		label: "Dormir",
		hint: "Recupera energia para o próximo dia.",
	},
];

const STAGE_CLOCK: Record<RoutineStage, string> = {
	MANHA: "08:00",
	JORNADA: "14:30",
	NOITE: "20:00",
	RESUMO: "22:30",
};

function pickRandom<T>(items: T[]): T {
	const index = Math.floor(Math.random() * items.length);
	return items[index];
}

function generateJourney(morningAction: MorningAction): JourneyResult {
	const commuteStories = [
		"O trânsito atrasou seu ritmo e cobrou sua paciência.",
		"Uma conversa inesperada mudou seu humor no meio do dia.",
		"Você precisou resolver um imprevisto que consumiu energia.",
		"Seu foco oscilou e você sentiu o dia mais pesado.",
	];

	if (morningAction === "TRABALHAR") {
		const workStories = [
			"No trabalho, surgiram demandas urgentes e a pressão aumentou.",
			"Você entregou resultados, mas saiu mentalmente exausto.",
			"A equipe teve conflitos e o expediente ficou desgastante.",
			"Houve reconhecimento parcial, porém o dia foi puxado.",
		];

		const stressGain = Math.random() < 0.45;
		return {
			story: `${pickRandom(commuteStories)} ${pickRandom(workStories)}`,
			energyDelta: stressGain ? -8 : -5,
			happinessDelta: stressGain ? -6 : -3,
			stressGain,
		};
	}

	// LAZER e ESTUDAR contam como falta (sem salário do dia)
	const leisureOrStudyStories = [
		"Você aproveitou o tempo para lazer ou estudo, mas não trabalhou hoje.",
		"O descanso ou aprendizado foi bom, mas não houve renda do trabalho.",
		"Você se dedicou a si mesmo, mas perdeu o salário do dia.",
		"A pausa ajudou seu corpo e mente, mas sem rendimento financeiro.",
	];

	return {
		story: pickRandom(leisureOrStudyStories),
		energyDelta: morningAction === "LAZER" ? 1 : -4,
		happinessDelta: morningAction === "LAZER" ? 4 : -1,
		stressGain: false,
	};
}

function generateDayStory(
	morningAction: MorningAction,
	eveningAction: EveningAction,
	journey: JourneyResult,
	takeOvertime: boolean,
): string {
	const openers = [
		"O dia terminou com aprendizados importantes.",
		"A rotina de hoje trouxe consequências claras para seu equilíbrio.",
		"Você fechou o dia com decisões que impactam os próximos turnos.",
	];

	const overtimePart = takeOvertime
		? "A hora extra aumentou sua renda, mas cobrou energia."
		: "Você preservou parte da energia ao evitar hora extra.";

	const stressPart = journey.stressGain
		? "O estresse subiu; sem lazer, estudo e hora extra vão render menos por até 3 dias."
		: "Sem pico de estresse hoje, sua produtividade se mantém estável.";

	return `${pickRandom(openers)} Manhã: ${morningAction}. Noite: ${eveningAction}. ${overtimePart} ${stressPart}`;
}

export function DailyEventModal({
	day,
	isSubmitting,
	motivationPercent,
	overtimeAvailable,
	stressDaysRemaining,
	onConfirm,
	isMinimized,
	onMinimize,
	onRestore,
}: DailyEventModalProps) {
	const [stage, setStage] = useState<RoutineStage>("MANHA");
	const [morningAction, setMorningAction] = useState<MorningAction | null>(
		null,
	);
	const [eveningAction, setEveningAction] = useState<EveningAction | null>(
		null,
	);
	const [takeOvertime, setTakeOvertime] = useState(false);
	const [journey, setJourney] = useState<JourneyResult | null>(null);
	const [aiDayStory, setAiDayStory] = useState<string>("");
	const [loadingAiStory, setLoadingAiStory] = useState(false);
	const modalCardRef = useRef<HTMLDivElement | null>(null);

	const canUseOvertime = useMemo(
		() => Boolean(overtimeAvailable && morningAction === "TRABALHAR"),
		[morningAction, overtimeAvailable],
	);

	const dayStory = useMemo(() => {
		if (!morningAction || !eveningAction || !journey) {
			return "";
		}

		return generateDayStory(
			morningAction,
			eveningAction,
			journey,
			takeOvertime,
		);
	}, [eveningAction, journey, morningAction, takeOvertime]);

	useEffect(() => {
		let cancelled = false;

		const shouldGenerate =
			stage === "RESUMO" &&
			Boolean(morningAction) &&
			Boolean(eveningAction) &&
			Boolean(journey);

		if (!shouldGenerate) {
			return;
		}

		const generate = async () => {
			setLoadingAiStory(true);
			try {
				const preferredProvider =
					typeof window !== "undefined"
						? ((window.localStorage.getItem("ai_provider") as
								| "auto"
								| "gemini"
								| "ollama"
								| null) ?? "auto")
						: "auto";

				const response = await fetch("/api/ai/story", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						prompt:
							"Resuma o dia do jogador com foco em trabalho, estudo, lazer e impacto no estresse.",
						context: dayStory,
						preferredProvider,
					}),
				});

				const json = (await response.json()) as { story?: string };
				if (!cancelled && response.ok && json.story) {
					setAiDayStory(json.story);
				}
			} catch {
				if (!cancelled) {
					setAiDayStory("");
				}
			} finally {
				if (!cancelled) {
					setLoadingAiStory(false);
				}
			}
		};

		void generate();

		return () => {
			cancelled = true;
		};
	}, [dayStory, eveningAction, journey, morningAction, stage]);

	useEffect(() => {
		const onMouseDown = (event: MouseEvent) => {
			if (!modalCardRef.current) {
				return;
			}

			if (!modalCardRef.current.contains(event.target as Node)) {
				onMinimize();
			}
		};

		document.addEventListener("mousedown", onMouseDown);
		return () => {
			document.removeEventListener("mousedown", onMouseDown);
		};
	}, [onMinimize]);

	if (isMinimized) {
		return (
			<div className="fixed bottom-20 right-4 z-40 w-full max-w-xs">
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-sm">Rotina diária minimizada</CardTitle>
					</CardHeader>
					<CardContent>
						<Button onClick={onRestore} className="w-full">
							Abrir rotina do dia
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
			<Card
				ref={modalCardRef}
				className="max-h-[82vh] w-full max-w-lg overflow-hidden"
			>
				<CardHeader className="flex flex-row items-start justify-between gap-3">
					<div>
						<CardTitle className="text-lg">
							Dia {day} · Rotina por etapas
						</CardTitle>
						<p className="mt-1 text-xs text-muted-foreground">
							Hora atual: {STAGE_CLOCK[stage]} · Motivação: {motivationPercent}%
						</p>
						<p className="text-xs text-muted-foreground">
							Estresse ativo: {stressDaysRemaining} dia(s)
						</p>
					</div>
					<Button variant="ghost" size="sm" onClick={onMinimize}>
						Minimizar
					</Button>
				</CardHeader>

				<CardContent className="max-h-[66vh] space-y-4 overflow-y-auto pr-1">
					{stage === "MANHA" ? (
						<>
							<p className="text-sm text-muted-foreground">
								Início do dia: escolha sua ação da manhã.
							</p>
							<div className="grid gap-2 sm:grid-cols-2">
								{MORNING_OPTIONS.map((option) => (
									<Button
										key={option.id}
										variant={
											morningAction === option.id ? "default" : "outline"
										}
										className="h-auto justify-start whitespace-normal wrap-break-word py-3 text-left"
										onClick={() => setMorningAction(option.id)}
									>
										<div>
											<p className="font-medium">{option.label}</p>
											<p className="text-xs text-muted-foreground">
												{option.hint}
											</p>
										</div>
									</Button>
								))}
							</div>
							<Button
								disabled={!morningAction}
								onClick={() => {
									if (!morningAction) {
										return;
									}
									setJourney(generateJourney(morningAction));
									setStage("JORNADA");
								}}
								className="w-full"
							>
								Confirmar manhã
							</Button>
						</>
					) : null}

					{stage === "JORNADA" && journey ? (
						<>
							<p className="text-sm text-muted-foreground">{journey.story}</p>
							<div className="rounded-md border border-border p-3 text-sm">
								<p>
									Energia: {journey.energyDelta >= 0 ? "+" : ""}
									{journey.energyDelta}
								</p>
								<p>
									Felicidade: {journey.happinessDelta >= 0 ? "+" : ""}
									{journey.happinessDelta}
								</p>
								<p>Estresse: {journey.stressGain ? "aumentou" : "estável"}</p>
							</div>

							{canUseOvertime ? (
								<div className="space-y-2 rounded-md border border-border p-3">
									<p className="text-sm font-medium">Fim do expediente</p>
									<p className="text-xs text-muted-foreground">
										Surgiu chance de hora extra.
									</p>
									<Button
										variant={takeOvertime ? "default" : "outline"}
										size="sm"
										onClick={() => setTakeOvertime((current) => !current)}
									>
										{takeOvertime ? "Hora extra: SIM" : "Hora extra: NÃO"}
									</Button>
								</div>
							) : null}

							<Button onClick={() => setStage("NOITE")} className="w-full">
								Continuar para noite
							</Button>
						</>
					) : null}

					{stage === "NOITE" ? (
						<>
							<p className="text-sm text-muted-foreground">
								Chegando em casa, escolha sua ação final do dia.
							</p>
							<div className="grid gap-2 sm:grid-cols-3">
								{EVENING_OPTIONS.map((option) => (
									<Button
										key={option.id}
										variant={
											eveningAction === option.id ? "default" : "outline"
										}
										className="h-auto justify-start whitespace-normal wrap-break-word py-3 text-left"
										onClick={() => setEveningAction(option.id)}
									>
										<div>
											<p className="font-medium">{option.label}</p>
											<p className="text-xs text-muted-foreground">
												{option.hint}
											</p>
										</div>
									</Button>
								))}
							</div>
							<Button
								disabled={!eveningAction}
								onClick={() => setStage("RESUMO")}
								className="w-full"
							>
								Avançar para resumo do dia
							</Button>
						</>
					) : null}

					{stage === "RESUMO" && journey && morningAction && eveningAction ? (
						<>
							<p className="text-sm text-muted-foreground">
								{loadingAiStory
									? "Gerando narrativa do dia..."
									: aiDayStory || dayStory}
							</p>
							<Button
								disabled={isSubmitting}
								onClick={async () => {
									await onConfirm({
										morningAction,
										eveningAction,
										takeOvertime,
										journeyEnergyDelta: journey.energyDelta,
										journeyHappinessDelta: journey.happinessDelta,
										journeyStressGain: journey.stressGain,
										journeyStory: journey.story,
										dayStory: aiDayStory || dayStory,
									});
								}}
								className="w-full"
							>
								{isSubmitting ? "Finalizando dia..." : "Finalizar dia"}
							</Button>
						</>
					) : null}
				</CardContent>
			</Card>
		</div>
	);
}
