"use client";

import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	MONTHS,
	WEEKDAYS,
	getDayMonth,
	getMonthDays,
	getFirstDayOfMonth,
	getDayOfWeek,
} from "@/data/game-config";
import { cn } from "@/lib/utils";

interface GameCalendarProps {
	day: number;
	logs: Array<{
		day: number;
		event_type: string;
		event_title: string;
		choice_made: string;
	}>;
	onSelectPastDay?: (day: number) => void;
}

type CalendarCell = {
	dayOfMonth: number;
	gameDay: number;
};

const EVENT_TYPE_COLORS: Record<string, string> = {
	TRABALHO: "bg-amber-500",
	ESTUDO: "bg-blue-500",
	LAZER: "bg-emerald-500",
	INVESTIMENTO: "bg-violet-500",
	ALEATORIO: "bg-slate-500",
};

function getEventCategory(eventType: string): keyof typeof EVENT_TYPE_COLORS {
	const normalized = eventType.toLowerCase();

	if (normalized.includes("trabalho") || normalized.includes("extra")) {
		return "TRABALHO";
	}

	if (normalized.includes("curso") || normalized.includes("estudo")) {
		return "ESTUDO";
	}

	if (normalized.includes("lazer") || normalized.includes("convite")) {
		return "LAZER";
	}

	if (
		normalized.includes("invest") ||
		normalized.includes("aplica") ||
		normalized.includes("renda")
	) {
		return "INVESTIMENTO";
	}

	return "ALEATORIO";
}

export function GameCalendar({
	day,
	logs,
	onSelectPastDay,
}: GameCalendarProps) {
	const { month: currentMonth } = getDayMonth(day);
	const [viewMonth, setViewMonth] = useState(currentMonth);

	const logsByDay = useMemo(() => {
		const map = new Map<
			number,
			{ event_type: string; event_title: string; choice_made: string }
		>();

		for (const log of logs) {
			map.set(Number(log.day), {
				event_type: log.event_type,
				event_title: log.event_title,
				choice_made: log.choice_made,
			});
		}

		return map;
	}, [logs]);

	const monthDays = getMonthDays(viewMonth);
	const firstGameDayOfMonth = getFirstDayOfMonth(viewMonth);
	const firstWeekday = getDayOfWeek(firstGameDayOfMonth);

	const canGoBack = viewMonth > 0;
	const canGoForward = viewMonth < currentMonth;

	const cells = useMemo(() => {
		const grid: Array<CalendarCell | null> = [];

		for (let i = 0; i < firstWeekday; i += 1) {
			grid.push({ dayOfMonth: 0, gameDay: -(i + 1) });
		}

		for (let dayOfMonth = 1; dayOfMonth <= monthDays; dayOfMonth += 1) {
			grid.push({
				dayOfMonth,
				gameDay: firstGameDayOfMonth + dayOfMonth - 1,
			});
		}

		return grid;
	}, [firstGameDayOfMonth, firstWeekday, monthDays]);

	return (
		<section className="rounded-lg border border-border bg-card p-4 md:p-6">
			<div className="mb-4 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<CalendarDays className="h-5 w-5 text-primary" />
					<h2 className="text-lg font-semibold">{MONTHS[viewMonth]}</h2>
				</div>
				<div className="flex items-center gap-1">
					<Button
						variant="ghost"
						size="icon"
						className="h-8 w-8"
						disabled={!canGoBack}
						onClick={() => setViewMonth((prev) => prev - 1)}
						aria-label="Mês anterior"
					>
						<ChevronLeft className="h-4 w-4" />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						className="h-8 w-8"
						disabled={!canGoForward}
						onClick={() => setViewMonth((prev) => prev + 1)}
						aria-label="Próximo mês"
					>
						<ChevronRight className="h-4 w-4" />
					</Button>
				</div>
			</div>

			<div className="grid grid-cols-7 gap-2 rounded-lg border border-border bg-background p-3">
				{WEEKDAYS.map((weekday) => (
					<div
						key={weekday}
						className="py-1 text-center text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
					>
						{weekday}
					</div>
				))}

				{cells.map((cell) => {
					if (cell.dayOfMonth === 0) {
						return (
							<div
								key={`empty-${Math.abs(cell.gameDay)}`}
								className="aspect-square"
							/>
						);
					}

					const isToday = cell.gameDay === day;
					const isPast = cell.gameDay < day;
					const isFuture = cell.gameDay > day;
					const log = logsByDay.get(cell.gameDay);
					const eventCategory = log ? getEventCategory(log.event_type) : null;
					const isClickablePast = Boolean(isPast && log && onSelectPastDay);

					return (
						<button
							type="button"
							onClick={() => {
								if (isClickablePast && onSelectPastDay) {
									onSelectPastDay(cell.gameDay);
								}
							}}
							disabled={!isClickablePast}
							key={cell.gameDay}
							className={cn(
								"relative flex aspect-square items-center justify-center rounded-md border text-sm",
								isToday &&
									"border-primary bg-primary text-primary-foreground font-semibold shadow-sm",
								isPast && !isToday && "border-border bg-card text-foreground",
								isFuture && "border-dashed border-border text-muted-foreground",
								isClickablePast &&
									"cursor-pointer hover:bg-secondary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
							)}
							title={
								log
									? `Dia ${cell.gameDay}: ${log.event_title || "Resumo do dia"}`
									: `Dia ${cell.gameDay}`
							}
						>
							<span>{cell.dayOfMonth}</span>
							{eventCategory ? (
								<span
									className={cn(
										"absolute right-1 top-1 h-2 w-2 rounded-full",
										EVENT_TYPE_COLORS[eventCategory],
									)}
								/>
							) : null}
							{isToday ? (
								<span className="absolute -bottom-1 h-1.5 w-6 rounded-full bg-primary" />
							) : null}
						</button>
					);
				})}
			</div>

			<p className="mt-3 text-xs text-muted-foreground">
				Dia atual do turno: {day}
			</p>
			<div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
				{Object.entries(EVENT_TYPE_COLORS).map(([type, color]) => (
					<div key={type} className="flex items-center gap-1.5">
						<span className={cn("h-2.5 w-2.5 rounded-full", color)} />
						<span>{type}</span>
					</div>
				))}
			</div>
		</section>
	);
}
