"use client";

import { useMemo } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────
const DAYS_PER_MONTH = 30;
// Each game month starts on Monday (col 1 of a Dom-Sáb week)
const START_DOW = 1;
const CELL_W = 56; // px
const CELL_H = 56; // px
const WEEKDAY_ROW_H = 32; // px

const MONTH_NAMES = [
	"Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
	"Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

// Grid has 7 columns × 5 rows = 35 slots (enough for any 30-day month + 1 offset)
const GRID_COLS = 7;
const GRID_ROWS = 5;

// ─── Helpers ──────────────────────────────────────────────────────────────────
type DayLog = {
	day: number;
	category?: string | null;
};

function getCategoryColor(category: string | null | undefined) {
	switch (category) {
		case "BOM":
			return { bg: "bg-green-500", text: "text-white" };
		case "RUIM":
			return { bg: "bg-red-500", text: "text-white" };
		case "DECISAO":
			return { bg: "bg-blue-500", text: "text-white" };
		case "COMPRA_IMPULSIVA":
			return { bg: "bg-orange-500", text: "text-white" };
		default:
			return { bg: "bg-primary/60", text: "text-white" };
	}
}

// Convert a game day (1-365) to { row, col } in the calendar grid for that month
function dayToGridPos(dayInMonth: number) {
	const gridIndex = dayInMonth - 1 + START_DOW;
	return {
		row: Math.floor(gridIndex / GRID_COLS),
		col: gridIndex % GRID_COLS,
	};
}

// Character absolute position (px) inside the grid container
function charPosition(row: number, col: number) {
	return {
		top: WEEKDAY_ROW_H + row * CELL_H + Math.round(CELL_H * 0.1),
		left: col * CELL_W + Math.round(CELL_W * 0.1),
	};
}

// ─── Component ────────────────────────────────────────────────────────────────
interface GameBoardProps {
	currentDay: number; // actual session day — used for coloring past cells
	displayDay: number; // character position (may differ during animation)
	logs: DayLog[];
	avatarFace: string; // emoji: 😄 / 😐 / 😞
}

export function GameBoard({
	currentDay,
	displayDay,
	logs,
	avatarFace,
}: GameBoardProps) {
	// The visible month follows the character (displayDay)
	const viewMonth = Math.ceil(displayDay / DAYS_PER_MONTH); // 1-12
	const dayStart = (viewMonth - 1) * DAYS_PER_MONTH + 1; // first game day of this month

	// Build log map for this month only
	const logMap = useMemo(() => {
		const m = new Map<number, string | null>();
		for (const log of logs) {
			m.set(log.day, log.category ?? null);
		}
		return m;
	}, [logs]);

	// Pre-compute grid slots with stable row-col IDs (avoids array-index as key)
	const gridSlots = useMemo(() => {
		return Array.from({ length: GRID_ROWS * GRID_COLS }, (_, i) => {
			const row = Math.floor(i / GRID_COLS);
			const col = i % GRID_COLS;
			const dayInMonth = i - START_DOW + 1;
			const gameDay = dayStart + dayInMonth - 1;
			const isValid =
				dayInMonth >= 1 && dayInMonth <= DAYS_PER_MONTH && gameDay <= 365;
			return {
				id: `r${row}-c${col}`,
				row,
				col,
				dayInMonth,
				gameDay,
				isValid,
			};
		});
	}, [dayStart]);

	// Character grid position
	const displayDayInMonth = ((displayDay - 1) % DAYS_PER_MONTH) + 1;
	const { row: charRow, col: charCol } = dayToGridPos(displayDayInMonth);
	const { top: charTop, left: charLeft } = charPosition(charRow, charCol);

	// Total grid container width (7 cols)
	const gridW = GRID_COLS * CELL_W;
	const gridH = WEEKDAY_ROW_H + GRID_ROWS * CELL_H;

	return (
		<div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
			{/* ── Month header ── */}
			<div className="flex items-center justify-between border-b border-border px-4 py-3">
				<div>
					<h2 className="text-lg font-bold text-foreground">
						{MONTH_NAMES[(viewMonth - 1) % 12]}
					</h2>
					<p className="text-xs text-muted-foreground">
						Mês {viewMonth} de 12 · Dias {dayStart}–{Math.min(dayStart + DAYS_PER_MONTH - 1, 365)}
					</p>
				</div>
				<div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
					Dia {currentDay} / 365
				</div>
			</div>

			{/* ── Calendar grid ── */}
			<div className="overflow-x-auto px-4 py-3">
				<div
					className="relative mx-auto"
					style={{ width: gridW, height: gridH }}
				>
					{/* Weekday labels row */}
					<div
						className="absolute left-0 top-0 grid"
						style={{
							width: gridW,
							height: WEEKDAY_ROW_H,
							gridTemplateColumns: `repeat(${GRID_COLS}, ${CELL_W}px)`,
						}}
					>
						{WEEKDAY_LABELS.map((wd) => (
							<div
								key={wd}
								className="flex items-center justify-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
								style={{ height: WEEKDAY_ROW_H }}
							>
								{wd}
							</div>
						))}
					</div>

					{/* Day cells */}
					<div
						className="absolute left-0"
						style={{
							top: WEEKDAY_ROW_H,
							width: gridW,
							height: GRID_ROWS * CELL_H,
							display: "grid",
							gridTemplateColumns: `repeat(${GRID_COLS}, ${CELL_W}px)`,
							gridTemplateRows: `repeat(${GRID_ROWS}, ${CELL_H}px)`,
						}}
					>
						{gridSlots.map((slot) => {
							if (!slot.isValid) {
								return <div key={slot.id} />;
							}

							const { gameDay } = slot;
							const isPast = gameDay < currentDay;
							const isCurrent = gameDay === currentDay;
							const isDisplay = gameDay === displayDay;
							const isFuture = gameDay > currentDay;
							const category = isPast ? logMap.get(gameDay) : null;
							const colors = getCategoryColor(category);

							return (
								<div
									key={slot.id}
									className={[
										"relative flex flex-col items-center justify-center rounded-lg m-0.5 select-none transition-all duration-200",
										isFuture
											? "bg-muted/50"
											: isPast || isCurrent
												? `${colors.bg} ${colors.text}`
												: "",
										isDisplay
											? "ring-2 ring-primary ring-offset-2"
											: "",
										isCurrent && !isDisplay
											? "ring-2 ring-primary/60"
											: "",
									]
										.filter(Boolean)
										.join(" ")}
									title={`Dia ${gameDay}`}
								>
									<span
										className={[
											"text-sm font-semibold leading-none",
											isFuture ? "text-muted-foreground/50" : "",
										].join(" ")}
									>
										{slot.dayInMonth}
									</span>
									{/* Small category dot for past days */}
									{isPast && category && (
										<span className="mt-0.5 text-[9px] opacity-80">
											{category === "BOM"
												? "✓"
												: category === "RUIM"
													? "✗"
													: category === "DECISAO"
														? "?"
														: "!"}
										</span>
									)}
								</div>
							);
						})}
					</div>

					{/* ── Animated character ── */}
					<div
						className="pointer-events-none absolute z-20 flex items-center justify-center transition-all ease-in-out"
						style={{
							top: charTop,
							left: charLeft,
							width: CELL_W - 4,
							height: CELL_H - 4,
							transitionDuration: "280ms",
						}}
					>
						<span
							className="text-2xl drop-shadow-md"
							style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))" }}
						>
							{avatarFace}
						</span>
					</div>
				</div>
			</div>

			{/* ── Legend ── */}
			<div className="border-t border-border px-4 py-2 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
				{[
					{ color: "bg-green-500", label: "Boa notícia" },
					{ color: "bg-red-500", label: "Má notícia" },
					{ color: "bg-blue-500", label: "Decisão" },
					{ color: "bg-orange-500", label: "Compra impulsiva" },
					{ color: "bg-primary/60", label: "Evento geral" },
				].map(({ color, label }) => (
					<span key={label} className="flex items-center gap-1">
						<span className={`inline-block h-2.5 w-2.5 rounded-sm ${color}`} />
						{label}
					</span>
				))}
			</div>
		</div>
	);
}
