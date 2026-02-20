interface AuthCardProps {
	title: string;
	description: string;
}

export function AuthCard({ title, description }: AuthCardProps) {
	return (
		<div className="rounded-lg border border-border bg-card p-4">
			<h2 className="text-lg font-semibold">{title}</h2>
			<p className="mt-1 text-sm text-muted-foreground">{description}</p>
		</div>
	);
}
