import type { ReactNode } from "react";

interface GameLayoutProps {
	top: ReactNode;
	center: ReactNode;
	right: ReactNode;
	modal: ReactNode;
}

export function GameLayout({ top, center, right, modal }: GameLayoutProps) {
	return (
		<main className="min-h-screen bg-background p-4 text-foreground">
			<div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
				<section className="space-y-4">
					{top}
					{center}
				</section>
				<aside>{right}</aside>
			</div>
			{modal}
		</main>
	);
}
