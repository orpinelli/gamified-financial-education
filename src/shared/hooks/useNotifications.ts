"use client";

import { useCallback, useMemo, useState } from "react";
import type { NotificationItem } from "@/src/shared/types/domain";

function buildId(): string {
	return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useNotifications() {
	const [items, setItems] = useState<NotificationItem[]>([]);

	const push = useCallback(
		(type: NotificationItem["type"], message: string) => {
			const item: NotificationItem = { id: buildId(), type, message };
			setItems((current) => [...current, item]);
			return item.id;
		},
		[],
	);

	const remove = useCallback((id: string) => {
		setItems((current) => current.filter((item) => item.id !== id));
	}, []);

	const clear = useCallback(() => {
		setItems([]);
	}, []);

	return useMemo(
		() => ({
			items,
			notifySuccess: (message: string) => push("success", message),
			notifyError: (message: string) => push("error", message),
			notifyInfo: (message: string) => push("info", message),
			remove,
			clear,
		}),
		[clear, items, push, remove],
	);
}
