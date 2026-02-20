interface TopBarProps {
	dateLabel: string;
	playerName: string;
	professionName: string;
	money: number;
}

export function TopBar({
	dateLabel,
	playerName,
	professionName,
	money,
}: TopBarProps) {
	return (
		<header className="rounded-lg border border-border bg-card p-4">
			<div className="grid gap-2 text-sm md:grid-cols-4">
				<p>
					<span className="text-muted-foreground">Data:</span> {dateLabel}
				</p>
				<p>
					<span className="text-muted-foreground">Nome:</span> {playerName}
				</p>
				<p>
					<span className="text-muted-foreground">Profissão:</span>{" "}
					{professionName}
				</p>
				<p>
					<span className="text-muted-foreground">Dinheiro:</span> R${" "}
					{money.toFixed(2)}
				</p>
			</div>
		</header>
	);
}
