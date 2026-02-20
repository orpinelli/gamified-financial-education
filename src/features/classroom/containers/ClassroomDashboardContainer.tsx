import { ClassroomStatusList } from "@/src/features/classroom/components/ClassroomStatusList";
import { useClassroomOverview } from "@/src/features/classroom/hooks/useClassroomOverview";

interface ClassroomDashboardContainerProps {
	students: Array<{ studentName: string; money: number; knowledge: number }>;
}

export function ClassroomDashboardContainer({
	students,
}: ClassroomDashboardContainerProps) {
	const overview = useClassroomOverview(students);

	return (
		<div className="space-y-3">
			<p className="text-sm text-muted-foreground">
				Média de dinheiro da turma: R$ {overview.averageMoney.toFixed(2)}
			</p>
			<ClassroomStatusList items={overview.students} />
		</div>
	);
}
