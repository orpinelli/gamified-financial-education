import type { EventOption, GameEvent } from "@/src/shared/types/domain";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DailyEventModalProps {
	event: GameEvent;
	onChoose: (option: EventOption) => void;
}

export function DailyEventModal({ event, onChoose }: DailyEventModalProps) {
	return (
		<div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
			<Card className="w-full max-w-xl">
				<CardHeader>
					<CardTitle>{event.title}</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<p className="text-sm text-muted-foreground">{event.description}</p>
					<div className="space-y-2">
						{event.options.map((option) => (
							<Button
								key={option.id}
								variant="outline"
								className="h-auto w-full justify-start py-3 text-left"
								onClick={() => onChoose(option)}
							>
								<div>
									<p className="font-medium">{option.label}</p>
									<p className="text-xs text-muted-foreground">
										{option.description}
									</p>
								</div>
							</Button>
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
