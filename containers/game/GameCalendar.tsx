"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DayLog } from "@/types/game";
import {
  MONTHS,
  WEEKDAYS,
  getDayMonth,
  getMonthDays,
  getFirstDayOfMonth,
  getDayOfWeek,
} from "@/data/game-config";
import { cn } from "@/lib/utils";

const EVENT_TYPE_COLORS: Record<string, string> = {
  TRABALHO: "bg-game-gold",
  ESTUDO: "bg-game-knowledge",
  LAZER: "bg-game-happiness",
  INVESTIMENTO: "bg-game-energy",
  ALEATORIO: "bg-game-health",
  PAGAMENTO: "bg-game-gold",
};

interface GameCalendarProps {
  currentDay: number;
  logs: DayLog[];
  onSelectDay?: (day: number) => void;
}

export function GameCalendar({ currentDay, logs, onSelectDay }: GameCalendarProps) {
  const { month: currentMonth } = getDayMonth(currentDay);
  const [viewMonth, setViewMonth] = useState(currentMonth);

  const canGoForward = viewMonth < currentMonth;
  const canGoBack = viewMonth > 0;

  const logsMap = useMemo(() => {
    const map = new Map<number, DayLog>();
    logs.forEach((log) => map.set(log.day, log));
    return map;
  }, [logs]);

  const monthDays = getMonthDays(viewMonth);
  const firstDay = getFirstDayOfMonth(viewMonth);
  const firstDayWeekday = getDayOfWeek(firstDay);

  // Build grid cells
  const cells: Array<{ dayNum: number; gameDay: number } | null> = [];

  // Empty cells before first day
  for (let i = 0; i < firstDayWeekday; i++) {
    cells.push(null);
  }

  // Actual days
  for (let d = 1; d <= monthDays; d++) {
    const gameDay = firstDay + d - 1;
    cells.push({ dayNum: d, gameDay });
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-bold text-card-foreground">
            {MONTHS[viewMonth]}
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={!canGoBack}
            onClick={() => setViewMonth((m) => m - 1)}
            aria-label="Mes anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={!canGoForward}
            onClick={() => setViewMonth((m) => m + 1)}
            aria-label="Proximo mes"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((wd) => (
          <div
            key={wd}
            className="py-1 text-center text-[10px] font-medium uppercase text-muted-foreground"
          >
            {wd}
          </div>
        ))}

        {cells.map((cell, idx) => {
          if (!cell) {
            return <div key={`empty-${idx}`} className="aspect-square" />;
          }

          const log = logsMap.get(cell.gameDay);
          const isToday = cell.gameDay === currentDay;
          const isPast = cell.gameDay < currentDay;
          const isFuture = cell.gameDay > currentDay;
          const eventColor = log ? EVENT_TYPE_COLORS[log.event_type] ?? "bg-muted" : "";

          return (
            <button
              key={cell.gameDay}
              type="button"
              disabled={isFuture}
              onClick={() => {
                if (log && onSelectDay) onSelectDay(cell.gameDay);
              }}
              className={cn(
                "relative flex aspect-square flex-col items-center justify-center rounded text-xs transition-colors",
                isToday && "ring-2 ring-primary bg-primary/20 font-bold text-primary",
                isPast && !isToday && "text-foreground hover:bg-secondary",
                isFuture && "text-muted-foreground/30 cursor-not-allowed",
                !isToday && !isFuture && "hover:bg-secondary/60"
              )}
            >
              <span className="leading-none">{cell.dayNum}</span>
              {log && (
                <span
                  className={cn("mt-0.5 h-1.5 w-1.5 rounded-full", eventColor)}
                  aria-label={`Evento: ${log.event_type}`}
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2 border-t border-border pt-2">
        {Object.entries(EVENT_TYPE_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1">
            <span className={cn("h-2 w-2 rounded-full", color)} />
            <span className="text-[10px] text-muted-foreground capitalize">
              {type.toLowerCase().replace("_", " ")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
