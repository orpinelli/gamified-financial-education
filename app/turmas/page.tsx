"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/containers/auth/hooks/useAuth";
import { AppHeader } from "@/src/shared/components/AppHeader";

type Classroom = {
	id: number;
	name: string;
	students_count: number;
};

export default function TurmasPage() {
	const router = useRouter();
	const { user, isLoading, logout, mutate } = useAuth();
	const [classrooms, setClassrooms] = useState<Classroom[]>([]);
	const [creating, setCreating] = useState(false);
	const [newName, setNewName] = useState("");
	const [savingNew, setSavingNew] = useState(false);
	const [errorMsg, setErrorMsg] = useState("");
	const nameId = useId();

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

	async function handleCreateClassroom() {
		const name = newName.trim();
		if (!name) {
			setErrorMsg("Informe o nome da turma.");
			return;
		}
		setSavingNew(true);
		setErrorMsg("");
		try {
			const res = await fetch("/api/classrooms", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name }),
			});
			const json = (await res.json()) as {
				classroom?: Classroom;
				error?: string;
			};
			if (!res.ok) {
				setErrorMsg(json.error ?? "Erro ao criar turma.");
				return;
			}
			if (json.classroom) {
				const created = json.classroom;
				setClassrooms((prev) => [...prev, { ...created, students_count: 0 }]);
			}
			setCreating(false);
			setNewName("");
		} catch {
			setErrorMsg("Erro de rede ao criar turma.");
		} finally {
			setSavingNew(false);
		}
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
					<CardHeader className="flex flex-row items-center justify-between">
						<CardTitle>Minhas turmas</CardTitle>
						<Button size="sm" onClick={() => { setCreating(true); setNewName(""); setErrorMsg(""); }}>
							Nova Turma
						</Button>
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
									<div className="flex gap-2">
										<Button asChild size="sm" variant="outline">
											<a href={`/turmas/${classroom.id}/ranking`}>Ranking</a>
										</Button>
										<Button asChild size="sm" variant="outline">
											<a href={`/turmas/${classroom.id}`}>Abrir</a>
										</Button>
									</div>
								</div>
							))
						)}
					</CardContent>
				</Card>
			</div>

			<Dialog
				open={creating}
				onOpenChange={(open) => {
					if (!open) setCreating(false);
				}}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Nova Turma</DialogTitle>
					</DialogHeader>
					<div className="space-y-3 text-sm">
						<div>
							<label htmlFor={nameId} className="block text-muted-foreground">
								Nome da turma
							</label>
							<input
								id={nameId}
								className="mt-1 w-full rounded border border-border bg-background px-3 py-2"
								value={newName}
								onChange={(e) => setNewName(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter") void handleCreateClassroom();
								}}
								autoFocus
							/>
						</div>
						{errorMsg ? (
							<p className="text-destructive text-xs">{errorMsg}</p>
						) : null}
						<div className="flex justify-end gap-2 pt-1">
							<Button
								variant="outline"
								onClick={() => setCreating(false)}
							>
								Cancelar
							</Button>
							<Button
								onClick={() => void handleCreateClassroom()}
								disabled={savingNew}
							>
								{savingNew ? "Criando..." : "Criar"}
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</main>
	);
}
