import type { GameState } from "@/src/shared/types/domain";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PlayerStatusPanelProps {
	state: GameState;
}

export function PlayerStatusPanel({ state }: PlayerStatusPanelProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Status</CardTitle>
			</CardHeader>
			<CardContent className="space-y-2 text-sm">
				<p>Conhecimento: {state.knowledge}</p>
				<p>Felicidade: {state.happiness}</p>
				<p>Energia: {state.energy}</p>
				<p>Dinheiro: R$ {state.money.toFixed(2)}</p>
			</CardContent>
		</Card>
	);
}
