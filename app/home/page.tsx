"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import { useAuth } from "@/containers/auth/hooks/useAuth";
import { AppHeader } from "@/src/shared/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type HomeGame = {
	id: number;
	character_name: string;
	profession_id: string;
	current_day: number;
	status: "ACTIVE" | "COMPLETED";
	updated_at: string;
};

type HomeClassroom = {
	id: number;
	name: string;
	students_count: number;
};

type Invite = {
	id: number;
	code: string;
	target_role: "ALUNO" | "PROFESSOR";
	expires_at: string | null;
	active: boolean;
	uses_count: number;
	max_uses: number;
};

type HomePayload = {
	games: HomeGame[];
	classrooms: HomeClassroom[];
	invites: Invite[];
	adminUsers?: Array<{
		id: number;
		name: string;
		email: string;
		role: "ADMIN" | "PROFESSOR" | "ALUNO";
	}>;
	adminStats: {
		professors: number;
		students: number;
		users: number;
		classrooms: number;
	} | null;
};

type AiStatusPayload = {
	providers: {
		gemini: boolean;
		ollama: boolean;
	};
	defaultProvider: "auto" | "gemini" | "ollama";
};

export default function HomePage() {
	const router = useRouter();
	const { user, isLoading, logout, mutate } = useAuth();
	const [data, setData] = useState<HomePayload | null>(null);
	const [loadingData, setLoadingData] = useState(true);
	const [creatingInvite, setCreatingInvite] = useState(false);
	const isSchoolStaff =
		user?.planType === "ESCOLAR" &&
		(user.role === "ADMIN" || user.role === "PROFESSOR");

	const activeGame = useMemo(
		() => data?.games.find((game) => game.status === "ACTIVE") ?? null,
		[data?.games],
	);

	const loadData = useCallback(async () => {
		setLoadingData(true);
		try {
			const response = await fetch("/api/home");
			const json = (await response.json()) as HomePayload;
			if (response.ok) {
				setData(json);
			}
		} finally {
			setLoadingData(false);
		}
	}, []);

	useEffect(() => {
		if (isLoading) return;
		if (!user) {
			router.push("/login");
			return;
		}
		void loadData();
	}, [isLoading, loadData, router, user]);

	useEffect(() => {
		const saved =
			typeof window !== "undefined"
				? (window.localStorage.getItem("ai_provider") as
						| "auto"
						| "gemini"
						| "ollama"
						| null)
				: null;

		const loadAiStatus = async () => {
			const response = await fetch("/api/ai/status");
			const json = (await response.json()) as AiStatusPayload;
			if (response.ok) {
				if (!saved) {
					window.localStorage.setItem(
						"ai_provider",
						json.defaultProvider ?? "auto",
					);
				}
			}
		};

		void loadAiStatus();
	}, []);

	if (isLoading || loadingData) {
		return (
			<main className="flex min-h-screen items-center justify-center">
				<p className="text-sm text-muted-foreground">Carregando...</p>
			</main>
		);
	}

	if (!user) {
		return null;
	}

	async function createInvite(targetRole: "ALUNO" | "PROFESSOR") {
		setCreatingInvite(true);
		try {
			await fetch("/api/school/invites", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ targetRole, expiresInDays: 30, maxUses: 30 }),
			});
			await loadData();
		} finally {
			setCreatingInvite(false);
		}
	}

	async function deleteSession(sessionId: number) {
		await fetch(`/api/game/sessions/${sessionId}`, { method: "DELETE" });
		await loadData();
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

				<div className="grid gap-4 lg:grid-cols-3">
					<section className="space-y-4 lg:col-span-2">
						<Card>
							<CardHeader className="flex flex-row items-center justify-between">
								<CardTitle>Meus jogos</CardTitle>
								<Button asChild>
									<a href="/game">
										<PlusCircle className="mr-2 h-4 w-4" /> Novo jogo
									</a>
								</Button>
							</CardHeader>
							<CardContent className="space-y-3">
								{(data?.games ?? []).length === 0 ? (
									<p className="text-sm text-muted-foreground">
										Nenhum jogo criado ainda.
									</p>
								) : (
									(data?.games ?? []).map((game) => (
										<div
											key={game.id}
											className="flex items-center justify-between rounded-md border border-border p-3"
										>
											<div>
												<p className="font-medium">{game.character_name}</p>
												<p className="text-xs text-muted-foreground">
													Dia {game.current_day} · {game.status}
												</p>
											</div>
											<div className="flex items-center gap-2">
												<Button asChild size="sm" variant="outline">
													<a href="/game">Entrar</a>
												</Button>
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button
															variant="ghost"
															size="icon"
															className="h-8 w-8"
														>
															<MoreHorizontal className="h-4 w-4" />
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="end">
														<DropdownMenuItem
															onClick={() => deleteSession(game.id)}
														>
															Deletar jogo
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											</div>
										</div>
									))
								)}
							</CardContent>
						</Card>

						{isSchoolStaff && (data?.classrooms ?? []).length > 0 ? (
							<Card>
								<CardHeader>
									<CardTitle>Turmas</CardTitle>
								</CardHeader>
								<CardContent className="space-y-2">
									{(data?.classrooms ?? []).map((classroom) => (
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
												<a href={`/turmas/${classroom.id}`}>Abrir turma</a>
											</Button>
										</div>
									))}
								</CardContent>
							</Card>
						) : null}

						{user.role === "ADMIN" ? (
							<Card>
								<CardHeader>
									<CardTitle>Pessoas da escola</CardTitle>
								</CardHeader>
								<CardContent className="space-y-2 text-sm">
									{(data?.adminUsers ?? []).map((person) => (
										<div
											key={person.id}
											className="flex items-center justify-between rounded border border-border p-2"
										>
											<div>
												<p className="font-medium">{person.name}</p>
												<p className="text-xs text-muted-foreground">
													{person.email}
												</p>
											</div>
											<span className="text-xs text-muted-foreground">
												{person.role}
											</span>
										</div>
									))}
								</CardContent>
							</Card>
						) : null}
					</section>

					<aside className="space-y-4">
						<Card>
							<CardHeader>
								<CardTitle>Status rápido</CardTitle>
							</CardHeader>
							<CardContent className="space-y-2 text-sm">
								<p>
									Jogo ativo:{" "}
									{activeGame ? `Dia ${activeGame.current_day}` : "Nenhum"}
								</p>
								{data?.adminStats ? (
									<>
										<p>Professores: {data.adminStats.professors}</p>
										<p>Turmas: {data.adminStats.classrooms}</p>
										<p>Alunos: {data.adminStats.students}</p>
									</>
								) : null}
							</CardContent>
						</Card>

						{isSchoolStaff ? (
							<Card>
								<CardHeader>
									<CardTitle>Convites</CardTitle>
								</CardHeader>
								<CardContent className="space-y-3">
									<div className="flex gap-2">
										<Button
											size="sm"
											variant="outline"
											disabled={creatingInvite}
											onClick={() => createInvite("ALUNO")}
										>
											Convite aluno
										</Button>
										<Button
											size="sm"
											variant="outline"
											disabled={creatingInvite}
											onClick={() => createInvite("PROFESSOR")}
										>
											Convite professor
										</Button>
									</div>
									<div className="space-y-2 text-xs">
										{(data?.invites ?? []).map((invite) => (
											<div
												key={invite.id}
												className="rounded border border-border p-2"
											>
												<p className="font-medium">Código: {invite.code}</p>
												<p className="text-muted-foreground">
													{invite.target_role} · {invite.uses_count}/
													{invite.max_uses}
												</p>
											</div>
										))}
									</div>
								</CardContent>
							</Card>
						) : null}
					</aside>
				</div>
			</div>
		</main>
	);
}
