"use client";

import { Trophy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/containers/auth/hooks/useAuth";
import { AppHeader } from "@/src/shared/components/AppHeader";
import type { RankingEntry } from "@/types/user";

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

type AvailableStudent = { id: number; name: string; email: string };
type ClassroomOption = { id: number; name: string; students_count: number };

export default function TurmaDetailsPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const router = useRouter();
	const { user, isLoading, logout, mutate } = useAuth();
	const [students, setStudents] = useState<StudentRow[]>([]);
	const [ranking, setRanking] = useState<RankingEntry[]>([]);
	const [classroomId, setClassroomId] = useState<number | null>(null);
	const [loadingRanking, setLoadingRanking] = useState(false);

	// Add student dialog
	const [addOpen, setAddOpen] = useState(false);
	const [available, setAvailable] = useState<AvailableStudent[]>([]);
	const [availableSearch, setAvailableSearch] = useState("");
	const [loadingAvailable, setLoadingAvailable] = useState(false);
	const [addingId, setAddingId] = useState<number | null>(null);

	// Move student dialog
	const [moveStudent, setMoveStudent] = useState<StudentRow | null>(null);
	const [allClassrooms, setAllClassrooms] = useState<ClassroomOption[]>([]);
	const [targetClassroomId, setTargetClassroomId] = useState<number | null>(null);
	const [moving, setMoving] = useState(false);

	// Remove student
	const [removingId, setRemovingId] = useState<number | null>(null);

	const [actionMsg, setActionMsg] = useState("");

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

	const loadRanking = async () => {
		if (!classroomId || ranking.length > 0) return;
		setLoadingRanking(true);
		try {
			const res = await fetch(`/api/classrooms/${classroomId}/ranking`);
			const data = (await res.json()) as { ranking: RankingEntry[] };
			if (res.ok) setRanking(data.ranking ?? []);
		} finally {
			setLoadingRanking(false);
		}
	};

	async function openAddDialog() {
		if (!classroomId) return;
		setAddOpen(true);
		setAvailableSearch("");
		setLoadingAvailable(true);
		try {
			const res = await fetch(
				`/api/classrooms/${classroomId}/available-students`,
			);
			const json = (await res.json()) as { students: AvailableStudent[] };
			if (res.ok) setAvailable(json.students);
		} finally {
			setLoadingAvailable(false);
		}
	}

	async function handleAddStudent(userId: number) {
		if (!classroomId) return;
		setAddingId(userId);
		try {
			const res = await fetch(`/api/classrooms/${classroomId}/students`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ userId }),
			});
			if (res.ok) {
				const added = available.find((s) => s.id === userId);
				if (added) {
					setStudents((prev) => [
						...prev,
						{
							id: added.id,
							name: added.name,
							email: added.email,
							lessons_watched: 0,
							game_status: null,
							current_day: null,
							money: null,
							knowledge: null,
							happiness: null,
							energy: null,
						},
					]);
					setAvailable((prev) => prev.filter((s) => s.id !== userId));
				}
				// Invalidate cached ranking
				setRanking([]);
			}
		} finally {
			setAddingId(null);
		}
	}

	async function handleRemoveStudent(userId: number) {
		if (!classroomId) return;
		setRemovingId(userId);
		setActionMsg("");
		try {
			const res = await fetch(
				`/api/classrooms/${classroomId}/students/${userId}`,
				{ method: "DELETE" },
			);
			if (res.ok) {
				setStudents((prev) => prev.filter((s) => s.id !== userId));
				setRanking([]);
			} else {
				const json = (await res.json()) as { error?: string };
				setActionMsg(json.error ?? "Erro ao remover aluno.");
			}
		} finally {
			setRemovingId(null);
		}
	}

	async function openMoveDialog(student: StudentRow) {
		setMoveStudent(student);
		setTargetClassroomId(null);
		if (allClassrooms.length === 0) {
			const res = await fetch("/api/classrooms");
			const json = (await res.json()) as { classrooms: ClassroomOption[] };
			if (res.ok) setAllClassrooms(json.classrooms);
		}
	}

	async function handleMoveStudent() {
		if (!classroomId || !moveStudent || !targetClassroomId) return;
		setMoving(true);
		setActionMsg("");
		try {
			const res = await fetch(
				`/api/classrooms/${targetClassroomId}/students`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						userId: moveStudent.id,
						fromClassroomId: classroomId,
					}),
				},
			);
			if (res.ok) {
				setStudents((prev) =>
					prev.filter((s) => s.id !== moveStudent.id),
				);
				setRanking([]);
				setMoveStudent(null);
				setTargetClassroomId(null);
			} else {
				const json = (await res.json()) as { error?: string };
				setActionMsg(json.error ?? "Erro ao mover aluno.");
			}
		} finally {
			setMoving(false);
		}
	}

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

	const medalEmoji = ["🥇", "🥈", "🥉"];
	const filteredAvailable = available.filter(
		(s) =>
			!availableSearch ||
			s.name.toLowerCase().includes(availableSearch.toLowerCase()),
	);

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

				<h1 className="text-xl font-semibold">Turma {classroomId}</h1>

				{actionMsg ? (
					<p className="text-sm text-destructive">{actionMsg}</p>
				) : null}

				<Tabs
					defaultValue="alunos"
					onValueChange={(v) => {
						if (v === "ranking") void loadRanking();
					}}
				>
					<TabsList>
						<TabsTrigger value="alunos">Alunos</TabsTrigger>
						<TabsTrigger value="ranking">
							<Trophy className="mr-1 h-4 w-4" /> Ranking
						</TabsTrigger>
					</TabsList>

					<TabsContent value="alunos">
						<Card>
							<CardHeader className="flex flex-row items-center justify-between">
								<CardTitle>Alunos da turma</CardTitle>
								<Button size="sm" onClick={() => void openAddDialog()}>
									Adicionar aluno
								</Button>
							</CardHeader>
							<CardContent className="space-y-3">
								{students.length === 0 ? (
									<p className="text-sm text-muted-foreground">
										Nenhum aluno nesta turma ainda.
									</p>
								) : (
									students.map((student) => (
										<div
											key={student.id}
											className="rounded-md border border-border p-3 text-sm"
										>
											<div className="flex items-start justify-between gap-2">
												<div className="flex-1 min-w-0">
													<p className="font-medium">{student.name}</p>
													<p className="text-xs text-muted-foreground truncate">
														{student.email}
													</p>
													<p>
														Aulas assistidas: {student.lessons_watched}
													</p>
													<p>
														Status:{" "}
														{student.game_status ?? "Sem jogo"}
														{student.current_day
															? ` · Dia ${student.current_day}`
															: ""}
													</p>
												</div>
												<div className="flex shrink-0 gap-2">
													<Button
														size="sm"
														variant="outline"
														disabled={
															removingId === student.id ||
															moving
														}
														onClick={() =>
															void openMoveDialog(student)
														}
													>
														Mover
													</Button>
													<Button
														size="sm"
														variant="outline"
														className="text-destructive hover:text-destructive"
														disabled={removingId === student.id}
														onClick={() =>
															void handleRemoveStudent(student.id)
														}
													>
														{removingId === student.id
															? "..."
															: "Remover"}
													</Button>
												</div>
											</div>
										</div>
									))
								)}
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value="ranking">
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Trophy className="h-5 w-5 text-accent" />
									Ranking da turma
								</CardTitle>
							</CardHeader>
							<CardContent>
								{loadingRanking ? (
									<p className="text-sm text-muted-foreground">
										Carregando ranking...
									</p>
								) : ranking.length === 0 ? (
									<p className="text-sm text-muted-foreground">
										Nenhum aluno com partida registrada ainda.
									</p>
								) : (
									<div className="space-y-2">
										{ranking.map((entry) => (
											<div
												key={entry.user_id}
												className="flex items-center gap-4 rounded-md border border-border p-3"
											>
												<span className="w-8 text-center text-lg font-bold">
													{entry.rank <= 3
														? medalEmoji[entry.rank - 1]
														: entry.rank}
												</span>
												<div className="flex-1">
													<p className="font-medium">{entry.name}</p>
													<p className="text-xs text-muted-foreground">
														Dia {entry.current_day} · R${" "}
														{Number(entry.money).toLocaleString(
															"pt-BR",
															{ minimumFractionDigits: 2 },
														)}
													</p>
												</div>
												<div className="hidden gap-4 text-xs text-muted-foreground sm:flex">
													<span title="Conhecimento">
														📚 {entry.knowledge}
													</span>
													<span title="Felicidade">
														😊 {entry.happiness}
													</span>
												</div>
												<div className="text-right">
													<p className="font-semibold text-primary">
														{entry.score} pts
													</p>
													{entry.game_status && (
														<p className="text-xs text-muted-foreground">
															{entry.game_status === "COMPLETED"
																? "Concluído"
																: "Em andamento"}
														</p>
													)}
												</div>
											</div>
										))}
									</div>
								)}
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>
			</div>

			{/* Add student dialog */}
			<Dialog open={addOpen} onOpenChange={setAddOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Adicionar aluno à turma</DialogTitle>
					</DialogHeader>
					<div className="space-y-3">
						<input
							className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
							placeholder="Buscar por nome..."
							value={availableSearch}
							onChange={(e) => setAvailableSearch(e.target.value)}
						/>
						<div className="max-h-64 overflow-y-auto space-y-2">
							{loadingAvailable ? (
								<p className="text-sm text-muted-foreground text-center py-4">
									Carregando...
								</p>
							) : filteredAvailable.length === 0 ? (
								<p className="text-sm text-muted-foreground text-center py-4">
									Nenhum aluno disponível.
								</p>
							) : (
								filteredAvailable.map((s) => (
									<div
										key={s.id}
										className="flex items-center justify-between rounded-md border border-border p-2 text-sm"
									>
										<div>
											<p className="font-medium">{s.name}</p>
											<p className="text-xs text-muted-foreground">
												{s.email}
											</p>
										</div>
										<Button
											size="sm"
											disabled={addingId === s.id}
											onClick={() => void handleAddStudent(s.id)}
										>
											{addingId === s.id ? "..." : "Adicionar"}
										</Button>
									</div>
								))
							)}
						</div>
						<div className="flex justify-end">
							<Button
								variant="outline"
								onClick={() => setAddOpen(false)}
							>
								Fechar
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			{/* Move student dialog */}
			<Dialog
				open={!!moveStudent}
				onOpenChange={(open) => {
					if (!open) setMoveStudent(null);
				}}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							Mover aluno — {moveStudent?.name}
						</DialogTitle>
					</DialogHeader>
					<div className="space-y-3 text-sm">
						<p className="text-muted-foreground">
							Selecione a turma de destino:
						</p>
						<select
							className="w-full rounded border border-border bg-background px-3 py-2"
							value={targetClassroomId ?? ""}
							onChange={(e) =>
								setTargetClassroomId(
									e.target.value ? Number(e.target.value) : null,
								)
							}
						>
							<option value="">Selecionar turma...</option>
							{allClassrooms
								.filter((c) => c.id !== classroomId)
								.map((c) => (
									<option key={c.id} value={c.id}>
										{c.name}
									</option>
								))}
						</select>
						<div className="flex justify-end gap-2 pt-1">
							<Button
								variant="outline"
								onClick={() => setMoveStudent(null)}
							>
								Cancelar
							</Button>
							<Button
								disabled={!targetClassroomId || moving}
								onClick={() => void handleMoveStudent()}
							>
								{moving ? "Movendo..." : "Mover"}
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</main>
	);
}
