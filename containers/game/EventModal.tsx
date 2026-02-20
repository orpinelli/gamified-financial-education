"use client";

import { useState } from "react";
import {
  Briefcase,
  BookOpen,
  Film,
  TrendingUp,
  Zap,
  DollarSign,
  Laptop,
  GraduationCap,
  Award,
  MapPin,
  Dumbbell,
  Gamepad2,
  PiggyBank,
  Coins,
  Thermometer,
  Search,
  Hammer,
  Gift,
  AlertTriangle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { GameEvent, EventOption, StatEffects } from "@/types/game";
import { DiceRoller } from "./DiceRoller";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, React.ElementType> = {
  Briefcase,
  BookOpen,
  Film,
  TrendingUp,
  Zap,
  DollarSign,
  Laptop,
  GraduationCap,
  Award,
  MapPin,
  Dumbbell,
  Gamepad2,
  PiggyBank,
  Coins,
  Thermometer,
  Search,
  Hammer,
  Gift,
  AlertTriangle,
};

const CATEGORY_COLORS: Record<string, string> = {
  TRABALHO: "bg-game-gold/20 text-game-gold border-game-gold/30",
  ESTUDO: "bg-game-knowledge/20 text-game-knowledge border-game-knowledge/30",
  LAZER: "bg-game-happiness/20 text-game-happiness border-game-happiness/30",
  INVESTIMENTO: "bg-game-energy/20 text-game-energy border-game-energy/30",
  ALEATORIO: "bg-game-health/20 text-game-health border-game-health/30",
  PAGAMENTO: "bg-game-gold/20 text-game-gold border-game-gold/30",
};

function formatEffects(effects: StatEffects): string {
  const parts: string[] = [];
  if (effects.money) parts.push(`R$${effects.money > 0 ? "+" : ""}${effects.money}`);
  if (effects.knowledge) parts.push(`Conhecimento ${effects.knowledge > 0 ? "+" : ""}${effects.knowledge}`);
  if (effects.happiness) parts.push(`Felicidade ${effects.happiness > 0 ? "+" : ""}${effects.happiness}`);
  if (effects.energy) parts.push(`Energia ${effects.energy > 0 ? "+" : ""}${effects.energy}`);
  if (effects.health) parts.push(`Saude ${effects.health > 0 ? "+" : ""}${effects.health}`);
  return parts.join(" | ") || "Sem efeitos";
}

interface EventModalProps {
  event: GameEvent | null;
  diceValues: number[];
  isRolling: boolean;
  isAdvancing: boolean;
  onRollDice: (count: 1 | 2) => number[];
  onAdvanceDay: (choiceLabel: string, effects: StatEffects, diceResult?: number) => void;
  onClose: () => void;
}

export function EventModal({
  event,
  diceValues,
  isRolling,
  isAdvancing,
  onRollDice,
  onAdvanceDay,
  onClose,
}: EventModalProps) {
  const [selectedOption, setSelectedOption] = useState<EventOption | null>(null);
  const [dicePhase, setDicePhase] = useState<"none" | "rolling" | "result">("none");
  const [finalDiceTotal, setFinalDiceTotal] = useState(0);

  if (!event) return null;

  const Icon = ICON_MAP[event.icon] ?? Zap;
  const categoryColor = CATEGORY_COLORS[event.category] ?? CATEGORY_COLORS.ALEATORIO;

  function handleChoose(option: EventOption) {
    if (option.requiresDice) {
      setSelectedOption(option);
      setDicePhase("rolling");
      const dice = onRollDice(option.requiresDice as 1 | 2);
      const total = dice.reduce((a, b) => a + b, 0);
      setFinalDiceTotal(total);

      setTimeout(() => {
        setDicePhase("result");
      }, 900);
    } else {
      // Direct choice - no dice needed
      onAdvanceDay(option.label, option.effects);
    }
  }

  function handleConfirmDice() {
    if (!selectedOption) return;
    const threshold = selectedOption.diceThreshold ?? 7;
    const isSuccess = finalDiceTotal >= threshold;

    const baseEffects = selectedOption.effects;
    const bonusEffects = isSuccess
      ? selectedOption.successEffects ?? {}
      : selectedOption.failureEffects ?? {};

    const mergedEffects: StatEffects = {
      money: (baseEffects.money ?? 0) + (bonusEffects.money ?? 0),
      knowledge: (baseEffects.knowledge ?? 0) + (bonusEffects.knowledge ?? 0),
      happiness: (baseEffects.happiness ?? 0) + (bonusEffects.happiness ?? 0),
      energy: (baseEffects.energy ?? 0) + (bonusEffects.energy ?? 0),
      health: (baseEffects.health ?? 0) + (bonusEffects.health ?? 0),
    };

    onAdvanceDay(
      `${selectedOption.label} (${isSuccess ? "Sucesso" : "Falha"})`,
      mergedEffects,
      finalDiceTotal
    );

    setSelectedOption(null);
    setDicePhase("none");
    setFinalDiceTotal(0);
  }

  const diceResultText =
    selectedOption && dicePhase === "result"
      ? finalDiceTotal >= (selectedOption.diceThreshold ?? 7)
        ? "Sucesso!"
        : "Falha..."
      : "";

  return (
    <Dialog open={!!event} onOpenChange={() => {
      if (!isAdvancing && dicePhase === "none") onClose();
    }}>
      <DialogContent className="max-w-md border-border bg-card sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg border", categoryColor)}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-card-foreground">{event.title}</DialogTitle>
              <Badge variant="outline" className={cn("mt-1 text-[10px]", categoryColor)}>
                {event.category}
              </Badge>
            </div>
          </div>
          <DialogDescription className="mt-3 leading-relaxed">
            {event.description}
          </DialogDescription>
        </DialogHeader>

        {dicePhase !== "none" && (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-secondary/30 p-4">
            <DiceRoller values={diceValues} isRolling={isRolling} />
            {dicePhase === "result" && selectedOption && (
              <>
                <p className="text-xs text-muted-foreground">
                  Precisava de {selectedOption.diceThreshold}+
                </p>
                <p
                  className={cn(
                    "text-lg font-bold",
                    finalDiceTotal >= (selectedOption.diceThreshold ?? 7)
                      ? "text-game-knowledge"
                      : "text-game-health"
                  )}
                >
                  {diceResultText}
                </p>
                {finalDiceTotal >= (selectedOption.diceThreshold ?? 7)
                  ? selectedOption.successEffects && (
                      <p className="text-xs text-game-knowledge">
                        {formatEffects(selectedOption.successEffects)}
                      </p>
                    )
                  : selectedOption.failureEffects && (
                      <p className="text-xs text-game-health">
                        {formatEffects(selectedOption.failureEffects)}
                      </p>
                    )}
                <Button onClick={handleConfirmDice} disabled={isAdvancing} className="mt-2">
                  {isAdvancing ? "Aplicando..." : "Continuar"}
                </Button>
              </>
            )}
          </div>
        )}

        {dicePhase === "none" && (
          <div className="flex flex-col gap-2">
            {event.options.map((option) => (
              <button
                key={option.id}
                type="button"
                disabled={isAdvancing}
                onClick={() => handleChoose(option)}
                className="flex flex-col gap-1 rounded-lg border border-border bg-secondary/30 p-3 text-left transition-colors hover:border-primary/50 hover:bg-secondary/60 disabled:opacity-50"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">{option.label}</span>
                  {option.requiresDice && (
                    <Badge variant="outline" className="text-[10px]">
                      {option.requiresDice === 1 ? "1 dado" : "2 dados"} ({option.diceThreshold}+)
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{option.description}</span>
                <span className="mt-1 text-xs font-medium text-primary">
                  {formatEffects(option.effects)}
                </span>
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
