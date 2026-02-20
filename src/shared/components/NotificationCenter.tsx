"use client";

import type { NotificationItem } from "@/src/shared/types/domain";
import { Button } from "@/components/ui/button";

interface NotificationCenterProps {
	items: NotificationItem[];
	onDismiss: (id: string) => void;
}

export function NotificationCenter({
	items,
	onDismiss,
}: NotificationCenterProps) {
	if (items.length === 0) {
		return null;
	}

	return (
		<div className="fixed right-4 top-4 z-50 flex w-80 flex-col gap-2">
			{items.map((item) => (
				<div
					key={item.id}
					className="rounded-md border border-border bg-card p-3 shadow-sm"
				>
					<div className="mb-2 flex items-center justify-between gap-2">
						<span className="text-xs font-semibold uppercase text-muted-foreground">
							{item.type}
						</span>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => onDismiss(item.id)}
							className="h-6 px-2"
						>
							fechar
						</Button>
					</div>
					<p className="text-sm text-foreground">{item.message}</p>
				</div>
			))}
		</div>
	);
}
