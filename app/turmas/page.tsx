"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/containers/auth/hooks/useAuth";
import { AppHeader } from "@/src/shared/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Classroom = {
	id: number;
	name: string;
	students_count: number;
};

export default function TurmasPage() {
	const router = useRouter();
	const { user, isLoading, logout, mutate } = useAuth();
	const [classrooms, setClassrooms] = useState<Classroom[]>([]);

	useEffect(() => {
		if (isLoading) return;
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
			const response = await fetch("/api/classrooms");
			const data = (await response.json()) as { classrooms: Classroom[] };
			if (response.ok) {
				setClassrooms(data.classrooms);
			}
		};

		void load();
	}, [isLoading, router, user]);

	if (
		isLoading ||
		!user ||
		user.role === "ALUNO" ||
		user.planType !== "ESCOLAR" ||
		(user.role !== "ADMIN" && user.role !== "PROFESSOR")
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
						<CardTitle>Minhas turmas</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						{classrooms.length === 0 ? (
							<p className="text-sm text-muted-foreground">
								Nenhuma turma encontrada.
							</p>
						) : (
							classrooms.map((classroom) => (
								<div
									key={classroom.id}
									className="flex items-center justify-between rounded-md border border-border p-3"
								>
									<div>
										<p className="font-medium">{classroom.name}</p>
										<p className="text-xs text-muted-foreground">
											{classroom.students_count} alunos
										</p>
									</div>
									<Button asChild size="sm" variant="outline">
										<a href={`/turmas/${classroom.id}`}>Abrir</a>
									</Button>
								</div>
							))
						)}
					</CardContent>
				</Card>
			</div>
		</main>
	);
}
