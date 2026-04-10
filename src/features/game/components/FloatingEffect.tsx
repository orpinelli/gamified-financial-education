"use client";

import { useEffect, useState } from "react";

export type FloatingEffectItem = {
	id: string;
	label: string;
	positive: boolean;
};

interface FloatingEffectProps {
	items: FloatingEffectItem[];
	onRemove: (id: string) => void;
}

export function FloatingEffect({ items, onRemove }: FloatingEffectProps) {
	return (
		<div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
			{items.map((item) => (
				<FloatingItem key={item.id} item={item} onRemove={onRemove} />
			))}
		</div>
	);
}

function FloatingItem({
	item,
	onRemove,
}: {
	item: FloatingEffectItem;
	onRemove: (id: string) => void;
}) {
	const [visible, setVisible] = useState(true);

	useEffect(() => {
		const timer = setTimeout(() => {
			setVisible(false);
			setTimeout(() => onRemove(item.id), 300);
		}, 1500);
		return () => clearTimeout(timer);
	}, [item.id, onRemove]);

	return (
		<div
			className={[
				"absolute left-1/2 -translate-x-1/2 rounded-full px-4 py-2 text-lg font-bold shadow-lg transition-all duration-300",
				item.positive
					? "bg-green-500 text-white"
					: "bg-red-500 text-white",
				visible ? "top-1/3 opacity-100" : "top-1/4 opacity-0",
			].join(" ")}
			style={{ transition: "top 1.5s ease-out, opacity 0.3s ease" }}
		>
			{item.label}
		</div>
	);
}

// Helper to build effect items from session diff
export function buildFloatingEffects(
	moneyDiff: number,
	happinessDiff: number,
	knowledgeDiff: number,
): FloatingEffectItem[] {
	const items: FloatingEffectItem[] = [];
	const id = () => Math.random().toString(36).slice(2);

	if (moneyDiff !== 0) {
		items.push({
			id: id(),
			label:
				moneyDiff > 0
					? `+R$${moneyDiff.toLocaleString("pt-BR")} 💰`
					: `-R$${Math.abs(moneyDiff).toLocaleString("pt-BR")} 💰`,
			positive: moneyDiff > 0,
		});
	}
	if (happinessDiff !== 0) {
		items.push({
			id: id(),
			label: happinessDiff > 0 ? `+${happinessDiff} 😊` : `${happinessDiff} 😊`,
			positive: happinessDiff > 0,
		});
	}
	if (knowledgeDiff !== 0) {
		items.push({
			id: id(),
			label: knowledgeDiff > 0 ? `+${knowledgeDiff} 📚` : `${knowledgeDiff} 📚`,
			positive: knowledgeDiff > 0,
		});
	}

	return items;
}
