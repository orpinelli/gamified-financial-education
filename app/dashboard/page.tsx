"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/containers/auth/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

type DashboardSchool = {
	id: number;
	name: string;
	plan_type: "FREE" | "INDIVIDUAL" | "ESCOLAR";
	plan_price: number;
	user_count: number;
};

type DashboardUser = {
	id: number;
	name: string;
	email: string;
	role: "ADMIN" | "PROFESSOR" | "ALUNO";
	plan_type: "FREE" | "INDIVIDUAL" | "ESCOLAR";
	plan_price: number;
	school_id?: number | null;
	school_name: string | null;
};

type DashboardPlan = {
	plan_type: "FREE" | "INDIVIDUAL" | "ESCOLAR";
	total_users: number;
	monthly_revenue: number;
};

type OverviewResponse = {
	schools: DashboardSchool[];
	users: DashboardUser[];
	planStats: DashboardPlan[];
	totals: {
		schools: number;
		users: number;
		revenue: number;
	};
};

export default function DashboardPage() {
	const router = useRouter();
	const { user, isLoading, logout } = useAuth();
	const publicSuperAdmins = (process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAILS ?? "")
		.split(",")
		.map((email) => email.trim().toLowerCase())
		.filter(Boolean);
	const isSuperAdmin = user
		? publicSuperAdmins.includes(user.email.toLowerCase())
		: false;
	const [overview, setOverview] = useState<OverviewResponse | null>(null);
	const [loadingOverview, setLoadingOverview] = useState(true);
	const [message, setMessage] = useState<string>("");
	const [savingUserId, setSavingUserId] = useState<number | null>(null);
	const [planDrafts, setPlanDrafts] = useState<
		Record<number, "FREE" | "INDIVIDUAL" | "ESCOLAR">
	>({});

	useEffect(() => {
		if (isLoading) return;
		if (!user) {
			router.push("/login");
			return;
		}

		if (user.role !== "ADMIN") {
			router.push("/home");
			setLoadingOverview(false);
			return;
		}

		const loadOverview = async () => {
			try {
				const res = await fetch("/api/dashboard/overview");
				const json = await res.json();
				if (res.ok) {
					setOverview(json);
					const draftState: Record<number, "FREE" | "INDIVIDUAL" | "ESCOLAR"> =
						{};
					for (const row of json.users as DashboardUser[]) {
						draftState[row.id] = row.plan_type;
					}
					setPlanDrafts(draftState);
				}
			} finally {
				setLoadingOverview(false);
			}
		};

		loadOverview();
	}, [user, isLoading, router]);

	if (isLoading || loadingOverview) {
		return (
			<main className="flex min-h-screen items-center justify-center">
				<p className="text-muted-foreground">Carregando dashboard...</p>
			</main>
		);
	}

	if (!user) return null;

	async function handleUpdatePlan(targetUserId: number) {
		if (!isSuperAdmin) {
			setMessage("Apenas SUPER ADMIN pode alterar plano.");
			return;
		}

		const selectedPlan = planDrafts[targetUserId];
		if (!selectedPlan) {
			return;
		}

		setSavingUserId(targetUserId);
		setMessage("");

		try {
			const response = await fetch(
				`/api/dashboard/users/${targetUserId}/plan`,
				{
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ planType: selectedPlan }),
				},
			);

			const json = (await response.json()) as { error?: string };

			if (!response.ok) {
				setMessage(json.error ?? "Nao foi possivel atualizar o plano.");
				return;
			}

			setMessage("Plano atualizado com sucesso.");
			const refreshed = await fetch("/api/dashboard/overview");
			const refreshedJson = (await refreshed.json()) as OverviewResponse;
			if (refreshed.ok) {
				setOverview(refreshedJson);
			}
		} catch {
			setMessage("Erro de rede ao atualizar plano.");
		} finally {
			setSavingUserId(null);
		}
	}

	return (
		<main className="min-h-screen bg-background p-6 text-foreground">
			<div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
				<div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
					<div>
						<h1 className="text-3xl font-bold">Dashboard</h1>
						<p className="text-sm text-muted-foreground">
							Controle de escolas, usuários e planos.
						</p>
					</div>
					<div className="flex items-center gap-2">
						<Badge variant="secondary">Plano: {user.planType}</Badge>
						<Button variant="outline" onClick={logout}>
							Sair
						</Button>
					</div>
				</div>

				{message ? (
					<div className="rounded-md border border-border bg-card p-3 text-sm text-foreground">
						{message}
					</div>
				) : null}

				{
					<>
						<div className="grid gap-4 md:grid-cols-3">
							<Card>
								<CardHeader>
									<CardTitle>Total de escolas</CardTitle>
								</CardHeader>
								<CardContent className="text-2xl font-semibold">
									{overview?.totals.schools ?? 0}
								</CardContent>
							</Card>

							<Card>
								<CardHeader>
									<CardTitle>Total de usuários</CardTitle>
								</CardHeader>
								<CardContent className="text-2xl font-semibold">
									{overview?.totals.users ?? 0}
								</CardContent>
							</Card>

							<Card>
								<CardHeader>
									<CardTitle>Receita mensal estimada</CardTitle>
								</CardHeader>
								<CardContent className="text-2xl font-semibold">
									R$ {(overview?.totals.revenue ?? 0).toFixed(2)}
								</CardContent>
							</Card>
						</div>

						<Card>
							<CardHeader>
								<CardTitle>Planos por usuários</CardTitle>
							</CardHeader>
							<CardContent>
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Plano</TableHead>
											<TableHead>Usuários</TableHead>
											<TableHead>Receita/mês</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{(overview?.planStats ?? []).map((row: DashboardPlan) => (
											<TableRow key={row.plan_type}>
												<TableCell>{row.plan_type}</TableCell>
												<TableCell>{row.total_users}</TableCell>
												<TableCell>
													R$ {Number(row.monthly_revenue).toFixed(2)}
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Escolas</CardTitle>
							</CardHeader>
							<CardContent>
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Nome</TableHead>
											<TableHead>Plano</TableHead>
											<TableHead>Valor</TableHead>
											<TableHead>Usuários</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{(overview?.schools ?? []).map(
											(school: DashboardSchool) => (
												<TableRow key={school.id}>
													<TableCell>{school.name}</TableCell>
													<TableCell>{school.plan_type}</TableCell>
													<TableCell>
														R$ {Number(school.plan_price).toFixed(2)}
													</TableCell>
													<TableCell>{Number(school.user_count)}</TableCell>
												</TableRow>
											),
										)}
									</TableBody>
								</Table>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Usuários</CardTitle>
							</CardHeader>
							<CardContent>
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Nome</TableHead>
											<TableHead>Email</TableHead>
											<TableHead>Perfil</TableHead>
											<TableHead>Plano atual</TableHead>
											{isSuperAdmin ? (
												<TableHead>Alterar plano</TableHead>
											) : null}
											<TableHead>Escola</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{(overview?.users ?? []).map((u: DashboardUser) => (
											<TableRow key={u.id}>
												<TableCell>{u.name}</TableCell>
												<TableCell>{u.email}</TableCell>
												<TableCell>{u.role}</TableCell>
												<TableCell>
													{u.plan_type} (R$ {Number(u.plan_price).toFixed(2)})
												</TableCell>
												{isSuperAdmin ? (
													<TableCell>
														<div className="flex items-center gap-2">
															<select
																value={planDrafts[u.id] ?? u.plan_type}
																onChange={(event) =>
																	setPlanDrafts((current) => ({
																		...current,
																		[u.id]: event.target.value as
																			| "FREE"
																			| "INDIVIDUAL"
																			| "ESCOLAR",
																	}))
																}
																className="rounded border border-border bg-background px-2 py-1 text-sm"
															>
																<option value="FREE">FREE</option>
																<option value="INDIVIDUAL">INDIVIDUAL</option>
																<option value="ESCOLAR">ESCOLAR</option>
															</select>
															<Button
																size="sm"
																variant="outline"
																onClick={() => handleUpdatePlan(u.id)}
																disabled={savingUserId === u.id}
															>
																{savingUserId === u.id
																	? "Salvando..."
																	: "Salvar"}
															</Button>
														</div>
													</TableCell>
												) : null}
												<TableCell>{u.school_name ?? "Sem escola"}</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</CardContent>
						</Card>
					</>
				}
			</div>
		</main>
	);
}
