"use client";

import {
  DollarSign,
  BookOpen,
  Smile,
  Zap,
  HeartPulse,
  TrendingUp,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { GameSession } from "@/types/game";
import type { Profession } from "@/types/game";
import { cn } from "@/lib/utils";

interface StatBarProps {
  label: string;
  value: number;
  maxValue: number;
  icon: React.ElementType;
  colorClass: string;
}

function StatBar({ label, value, maxValue, icon: Icon, colorClass }: StatBarProps) {
  const pct = Math.round((value / maxValue) * 100);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Icon className={cn("h-4 w-4", colorClass)} />
          <span className="text-xs font-medium text-foreground">{label}</span>
        </div>
        <span className="text-xs tabular-nums text-muted-foreground">
          {value}/{maxValue}
        </span>
      </div>
      <Progress value={pct} className="h-2" />
    </div>
  );
}

interface PlayerStatsPanelProps {
  session: GameSession;
  profession: Profession | null;
  currentDay: number;
  totalDays: number;
}

export function PlayerStatsPanel({
  session,
  profession,
  currentDay,
  totalDays,
}: PlayerStatsPanelProps) {
  const money = Number(session.money);
  const knowledge = Number(session.knowledge);
  const happiness = Number(session.happiness);
  const energy = Number(session.energy);
  const health = Number(session.health);

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/20">
          <TrendingUp className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-card-foreground">Status</h3>
          <p className="text-xs text-muted-foreground">
            Dia {currentDay} de {totalDays}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-md bg-game-gold/10 p-3">
        <DollarSign className="h-5 w-5 text-game-gold" />
        <div>
          <p className="text-xs text-muted-foreground">Dinheiro</p>
          <p className="text-lg font-bold tabular-nums text-foreground">
            R$ {money.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <StatBar
          label="Conhecimento"
          value={knowledge}
          maxValue={100}
          icon={BookOpen}
          colorClass="text-game-knowledge"
        />
        <StatBar
          label="Felicidade"
          value={happiness}
          maxValue={100}
          icon={Smile}
          colorClass="text-game-happiness"
        />
        <StatBar
          label="Energia"
          value={energy}
          maxValue={100}
          icon={Zap}
          colorClass="text-game-energy"
        />
        <StatBar
          label="Saude"
          value={health}
          maxValue={100}
          icon={HeartPulse}
          colorClass="text-game-health"
        />
      </div>

      {profession && (
        <div className="rounded-md border border-border bg-secondary/50 p-3">
          <p className="text-xs text-muted-foreground">Profissao</p>
          <p className="text-sm font-semibold text-foreground">{profession.name}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Crescimento: x{profession.growthMultiplier}
          </p>
        </div>
      )}
    </div>
  );
}
