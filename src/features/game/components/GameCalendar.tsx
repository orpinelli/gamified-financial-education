interface GameCalendarProps {
	day: number;
}

export function GameCalendar({ day }: GameCalendarProps) {
	return (
		<section className="rounded-lg border border-border bg-card p-6">
			<h2 className="mb-2 text-lg font-semibold">Calendário</h2>
			<p className="text-sm text-muted-foreground">Turno atual: Dia {day}</p>
		</section>
	);
}
