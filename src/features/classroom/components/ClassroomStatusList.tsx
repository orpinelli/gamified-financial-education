interface ClassroomStatusListProps {
	items: Array<{ studentName: string; money: number; knowledge: number }>;
}

export function ClassroomStatusList({ items }: ClassroomStatusListProps) {
	return (
		<div className="rounded-lg border border-border bg-card p-4">
			<h3 className="mb-3 text-base font-semibold">Status dos alunos</h3>
			<ul className="space-y-2 text-sm">
				{items.map((item) => (
					<li
						key={item.studentName}
						className="rounded border border-border p-2"
					>
						<p className="font-medium">{item.studentName}</p>
						<p className="text-muted-foreground">
							Dinheiro: R$ {item.money.toFixed(2)} | Conhecimento:{" "}
							{item.knowledge}
						</p>
					</li>
				))}
			</ul>
		</div>
	);
}
