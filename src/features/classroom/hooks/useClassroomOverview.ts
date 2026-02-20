interface StudentGameSnapshot {
	studentName: string;
	money: number;
	knowledge: number;
}

export function useClassroomOverview(students: StudentGameSnapshot[]) {
	const averageMoney =
		students.length === 0
			? 0
			: students.reduce((acc, student) => acc + student.money, 0) /
				students.length;

	return {
		students,
		averageMoney,
	};
}
