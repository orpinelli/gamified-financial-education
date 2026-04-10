"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Trophy } from "lucide-react";
import { useAuth } from "@/containers/auth/hooks/useAuth";
import { AppHeader } from "@/src/shared/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RankingEntry } from "@/types/user";

export default function ClassroomRankingPage() {
	const params = useParams();
	const router = useRouter();
	const { user, isLoading, logout, mutate } = useAuth();
	const [ranking, setRanking] = useState<RankingEntry[]>([]);
	const [loadingRanking, setLoadingRanking] = useState(true);
	const [classroomName, setClassroomName] = useState("");

	const classroomId = params.id as string;

	useEffect(() => {
		if (isLoading) return;
		if (!user) {
			router.push("/login");
			return;
		}

		const load = async () => {
			setLoadingRanking(true);
			try {
				const res = await fetch(`/api/classrooms/${classroomId}/ranking`);
				if (!res.ok) {
					router.push("/home");
					return;
				}
				const json = (await res.json()) as {
					ranking: RankingEntry[];
					classroomName: string;
				};
				setRanking(json.ranking ?? []);
				setClassroomName(json.classroomName ?? `Turma ${classroomId}`);
			} finally {
				setLoadingRanking(false);
			}
		};

		void load();
	}, [isLoading, user, router, classroomId]);

	if (isLoading || loadingRanking) {
		return (
			<main className="flex min-h-screen items-center justify-center">
				<p className="text-sm text-muted-foreground">Carregando ranking...</p>
			</main>
		);
	}

	if (!user) return null;

	const medalColors: Record<number, string> = {
		1: "text-yellow-500",
		2: "text-slate-400",
		3: "text-amber-600",
	};

	return (
		<main className="min-h-screen bg-background p-4 text-foreground md:p-6">
			<div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
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

				<div className="flex items-center gap-3">
					<Button variant="outline" size="sm" onClick={() => router.push("/home")}>
						<ArrowLeft className="mr-1 h-4 w-4" /> Voltar
					</Button>
					<h1 className="text-xl font-semibold">
						Ranking — {classroomName}
					</h1>
				</div>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Trophy className="h-5 w-5 text-accent" />
							Classificação da turma
						</CardTitle>
					</CardHeader>
					<CardContent>
						{ranking.length === 0 ? (
							<p className="text-sm text-muted-foreground">
								Nenhum aluno com partida registrada ainda.
							</p>
						) : (
							<div className="space-y-2">
								{ranking.map((entry) => {
									const isMe = entry.user_id === user.id;
									return (
										<div
											key={entry.user_id}
											className={`flex items-center gap-4 rounded-md border p-3 ${
												isMe
													? "border-primary bg-primary/10"
													: "border-border"
											}`}
										>
											<span
												className={`w-8 text-center text-lg font-bold ${
													medalColors[entry.rank] ?? "text-muted-foreground"
												}`}
											>
												{entry.rank <= 3 ? "🥇🥈🥉"[entry.rank - 1] : entry.rank}
											</span>
											<div className="flex-1">
												<p className="font-medium">
													{entry.name}
													{isMe && (
														<span className="ml-2 text-xs text-primary">
															(você)
														</span>
													)}
												</p>
												<p className="text-xs text-muted-foreground">
													Dia {entry.current_day} · R${" "}
													{Number(entry.money).toLocaleString("pt-BR", {
														minimumFractionDigits: 2,
													})}
												</p>
											</div>
											<div className="hidden gap-4 text-xs text-muted-foreground sm:flex">
												<span title="Conhecimento">📚 {entry.knowledge}</span>
												<span title="Felicidade">😊 {entry.happiness}</span>
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
									);
								})}
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</main>
	);
}
