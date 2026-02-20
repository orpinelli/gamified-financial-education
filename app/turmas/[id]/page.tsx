"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/containers/auth/hooks/useAuth";
import { AppHeader } from "@/src/shared/components/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type StudentRow = {
	id: number;
	name: string;
	email: string;
	lessons_watched: number;
	game_status: "ACTIVE" | "COMPLETED" | null;
	current_day: number | null;
	money: number | null;
	knowledge: number | null;
	happiness: number | null;
	energy: number | null;
};

export default function TurmaDetailsPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const router = useRouter();
	const { user, isLoading, logout, mutate } = useAuth();
	const [students, setStudents] = useState<StudentRow[]>([]);
	const [classroomId, setClassroomId] = useState<number | null>(null);

	useEffect(() => {
		void (async () => {
			const { id } = await params;
			setClassroomId(Number(id));
		})();
	}, [params]);

	useEffect(() => {
		if (isLoading || !classroomId) return;
		if (!user) {
			router.push("/login");
			return;
		}
		if (
			user.role === "ALUNO" ||
			user.planType !== "ESCOLAR" ||
			(user.role !== "ADMIN" && user.role !== "PROFESSOR")
		) {
			router.push("/home");
			return;
		}

		const load = async () => {
			const response = await fetch(`/api/classrooms/${classroomId}`);
			const data = (await response.json()) as { students: StudentRow[] };
			if (response.ok) {
				setStudents(data.students);
			}
		};

		void load();
	}, [classroomId, isLoading, router, user]);

	if (
		isLoading ||
		!user ||
		user.role === "ALUNO" ||
		user.planType !== "ESCOLAR" ||
		(user.role !== "ADMIN" && user.role !== "PROFESSOR") ||
		!classroomId
	) {
		return null;
	}

	return (
		<main className="min-h-screen bg-background p-4 text-foreground md:p-6">
			<div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
				<AppHeader
					user={user}
					onLogout={logout}
					onPlanUpdated={(planType) =>
						mutate(
							(current) =>
								current?.user
									? { user: { ...current.user, planType } }
									: current,
							false,
						)
					}
				/>

				<Card>
					<CardHeader>
						<CardTitle>Alunos da turma {classroomId}</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						{students.map((student) => (
							<div
								key={student.id}
								className="rounded-md border border-border p-3 text-sm"
							>
								<p className="font-medium">{student.name}</p>
								<p className="text-xs text-muted-foreground">{student.email}</p>
								<p>Aulas assistidas: {student.lessons_watched}</p>
								<p>
									Jogando agora:{" "}
									{student.game_status === "ACTIVE" ? "Sim" : "Não"}
								</p>
								<p>
									Status do jogo: {student.game_status ?? "Sem jogo"}
									{student.current_day ? ` · Dia ${student.current_day}` : ""}
								</p>
							</div>
						))}
					</CardContent>
				</Card>
			</div>
		</main>
	);
}
