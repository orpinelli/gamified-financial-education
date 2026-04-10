"use client";

import { Check, ChevronsUpDown, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/containers/auth/hooks/useAuth";
import { cn } from "@/lib/utils";
import { AppHeader } from "@/src/shared/components/AppHeader";

const PUBLIC_SUPER_ADMINS = (process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAILS ?? "")
	.split(",")
	.map((e) => e.trim().toLowerCase())
	.filter(Boolean);

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
	active: boolean;
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
	totals: { schools: number; users: number; revenue: number };
};

type EditDraft = {
	name: string;
	email: string;
	role: "ADMIN" | "PROFESSOR" | "ALUNO";
	planType: "FREE" | "INDIVIDUAL" | "ESCOLAR";
	schoolId: number | null;
};

type SchoolOption = { id: number; name: string };
type ClassroomOption = { id: number; name: string; students_count: number };

export default function DashboardPage() {
	const router = useRouter();
	const { user, isLoading, logout, mutate } = useAuth();

	const isSuperAdmin = user
		? PUBLIC_SUPER_ADMINS.includes(user.email.toLowerCase())
		: false;

	// Data
	const [overview, setOverview] = useState<OverviewResponse | null>(null);
	const [loadingOverview, setLoadingOverview] = useState(true);
	const [schools, setSchools] = useState<SchoolOption[]>([]);
	const [classrooms, setClassrooms] = useState<ClassroomOption[]>([]);

	// Edit & save
	const [message, setMessage] = useState("");
	const [savingUserId, setSavingUserId] = useState<number | null>(null);
	const [planDrafts, setPlanDrafts] = useState<Record<number, "FREE" | "INDIVIDUAL" | "ESCOLAR">>({});
	const [editingUser, setEditingUser] = useState<DashboardUser | null>(null);
	const [editDraft, setEditDraft] = useState<EditDraft | null>(null);
	const [savingEdit, setSavingEdit] = useState(false);
	const [schoolPickerOpen, setSchoolPickerOpen] = useState(false);
	const [schoolSearch, setSchoolSearch] = useState("");

	// Client-side filters
	const [filterSchoolId, setFilterSchoolId] = useState<number | null>(null);
	const [filterSchoolOpen, setFilterSchoolOpen] = useState(false);
	const [filterSchoolSearch, setFilterSchoolSearch] = useState("");
	const [filterClassroomId, setFilterClassroomId] = useState<number | null>(null);
	const [filterClassroomOpen, setFilterClassroomOpen] = useState(false);
	const [filterClassroomSearch, setFilterClassroomSearch] = useState("");
	const [classroomMemberIds, setClassroomMemberIds] = useState<Set<number> | null>(null);
	const [userSearch, setUserSearch] = useState("");

	const editId = useId();

	// ── Data loaders ──────────────────────────────────────────────
	const loadOverview = useCallback(async () => {
		setLoadingOverview(true);
		try {
			const res = await fetch("/api/dashboard/overview");
			const json = await res.json();
			if (res.ok) {
				setOverview(json);
				const drafts: Record<number, "FREE" | "INDIVIDUAL" | "ESCOLAR"> = {};
				for (const row of json.users as DashboardUser[]) {
					drafts[row.id] = row.plan_type;
				}
				setPlanDrafts(drafts);
			}
		} finally {
			setLoadingOverview(false);
		}
	}, []);

	const loadSchools = useCallback(async () => {
		const res = await fetch("/api/schools");
		if (res.ok) {
			const json = (await res.json()) as { schools: SchoolOption[] };
			setSchools(json.schools);
		}
	}, []);

	const loadClassrooms = useCallback(async (schoolId: number | null) => {
		const url = schoolId ? `/api/classrooms?schoolId=${schoolId}` : "/api/classrooms";
		const res = await fetch(url);
		if (res.ok) {
			const json = (await res.json()) as { classrooms: ClassroomOption[] };
			setClassrooms(json.classrooms);
		}
	}, []);

	useEffect(() => {
		if (isLoading) return;
		if (!user) { router.push("/login"); return; }
		if (user.role !== "ADMIN") { router.push("/home"); setLoadingOverview(false); return; }

		const superAdmin = PUBLIC_SUPER_ADMINS.includes(user.email.toLowerCase());
		void Promise.all([
			loadOverview(),
			loadSchools(),
			// ADMIN (not super) already has one school → pre-load classrooms
			...(superAdmin ? [] : [loadClassrooms(null)]),
		]);
	}, [user, isLoading, router, loadOverview, loadSchools, loadClassrooms]);

	// ── Filter handlers (client-side only, no re-fetch) ───────────
	async function handleSelectSchool(schoolId: number | null) {
		setFilterSchoolId(schoolId);
		setFilterSchoolOpen(false);
		setFilterSchoolSearch("");
		// Reset classroom filter
		setFilterClassroomId(null);
		setClassroomMemberIds(null);
		setFilterClassroomSearch("");
		// Load classrooms for the selected school
		await loadClassrooms(schoolId);
	}

	async function handleSelectClassroom(classroomId: number | null) {
		setFilterClassroomId(classroomId);
		setFilterClassroomOpen(false);
		setFilterClassroomSearch("");
		if (classroomId) {
			const res = await fetch(`/api/classrooms/${classroomId}/members`);
			if (res.ok) {
				const json = (await res.json()) as { userIds: number[] };
				setClassroomMemberIds(new Set(json.userIds));
			}
		} else {
			setClassroomMemberIds(null);
		}
	}

	function clearFilters() {
		setFilterSchoolId(null);
		setFilterClassroomId(null);
		setClassroomMemberIds(null);
		setUserSearch("");
		setFilterSchoolSearch("");
		setFilterClassroomSearch("");
		void loadClassrooms(null);
	}

	// ── Computed: filtered user list ─────────────────────────────
	const displayedUsers = (overview?.users ?? []).filter((u) => {
		if (filterSchoolId !== null && u.school_id !== filterSchoolId) return false;
		if (classroomMemberIds !== null && !classroomMemberIds.has(u.id)) return false;
		if (userSearch.trim()) {
			const q = userSearch.toLowerCase();
			if (!u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
		}
		return true;
	});

	const hasActiveFilter = filterSchoolId !== null || filterClassroomId !== null || userSearch.trim() !== "";

	// ── Auth loading — only block before we know who the user is ────
	if (isLoading) {
		return (
			<main className="flex min-h-screen items-center justify-center">
				<p className="text-muted-foreground">Carregando...</p>
			</main>
		);
	}
	if (!user) return null;

	// ── Action handlers ──────────────────────────────────────────
	async function handleUpdatePlan(targetUserId: number) {
		if (!isSuperAdmin) { setMessage("Apenas SUPER ADMIN pode alterar plano."); return; }
		const selectedPlan = planDrafts[targetUserId];
		if (!selectedPlan) return;
		setSavingUserId(targetUserId);
		setMessage("");
		try {
			const res = await fetch(`/api/dashboard/users/${targetUserId}/plan`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ planType: selectedPlan }),
			});
			const json = (await res.json()) as { error?: string };
			if (!res.ok) { setMessage(json.error ?? "Nao foi possivel atualizar o plano."); return; }
			setMessage("Plano atualizado com sucesso.");
			await loadOverview();
		} catch { setMessage("Erro de rede ao atualizar plano."); }
		finally { setSavingUserId(null); }
	}

	async function handleToggleActive(targetUserId: number, active: boolean) {
		setSavingUserId(targetUserId);
		setMessage("");
		try {
			const res = await fetch(`/api/dashboard/users/${targetUserId}/status`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ active }),
			});
			const json = (await res.json()) as { error?: string };
			if (!res.ok) { setMessage(json.error ?? "Nao foi possivel alterar o status."); return; }
			setOverview((prev) => prev ? {
				...prev,
				users: prev.users.map((u) => u.id === targetUserId ? { ...u, active } : u),
			} : prev);
		} catch { setMessage("Erro de rede ao alterar status."); }
		finally { setSavingUserId(null); }
	}

	async function handleChangeRole(targetUserId: number, role: "ADMIN" | "PROFESSOR" | "ALUNO") {
		setSavingUserId(targetUserId);
		setMessage("");
		try {
			const res = await fetch(`/api/dashboard/users/${targetUserId}/role`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ role }),
			});
			const json = (await res.json()) as { error?: string };
			if (!res.ok) { setMessage(json.error ?? "Nao foi possivel alterar o perfil."); return; }
			setOverview((prev) => prev ? {
				...prev,
				users: prev.users.map((u) => u.id === targetUserId ? { ...u, role } : u),
			} : prev);
		} catch { setMessage("Erro de rede ao alterar perfil."); }
		finally { setSavingUserId(null); }
	}

	function openEdit(u: DashboardUser) {
		setEditingUser(u);
		setEditDraft({ name: u.name, email: u.email, role: u.role, planType: u.plan_type, schoolId: u.school_id ?? null });
		setSchoolSearch("");
		setSchoolPickerOpen(false);
	}

	async function handleSaveEdit() {
		if (!editingUser || !editDraft) return;
		setSavingEdit(true);
		setMessage("");
		try {
			const res = await fetch(`/api/dashboard/users/${editingUser.id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(editDraft),
			});
			const json = (await res.json()) as { error?: string };
			if (!res.ok) { setMessage(json.error ?? "Nao foi possivel salvar as alteracoes."); return; }
			setMessage("Usuário atualizado com sucesso.");
			setEditingUser(null);
			setEditDraft(null);
			await loadOverview();
		} catch { setMessage("Erro de rede ao salvar."); }
		finally { setSavingEdit(false); }
	}

	// ── Render ───────────────────────────────────────────────────
	return (
		<main className="min-h-screen bg-background p-6 text-foreground">
			<div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
				<AppHeader
					user={user}
					onLogout={logout}
					onPlanUpdated={(planType) =>
						mutate((c) => c?.user ? { user: { ...c.user, planType } } : c, false)
					}
				/>

				<div>
					<h1 className="text-2xl font-bold">Dashboard</h1>
					<p className="text-sm text-muted-foreground">
						{isSuperAdmin ? "Controle global de escolas, usuários e planos." : "Controle de acesso da sua escola."}
					</p>
				</div>

				{message ? (
					<div className="rounded-md border border-border bg-card p-3 text-sm">{message}</div>
				) : null}

				{/* ── SUPER_ADMIN global stats ── */}
				{isSuperAdmin && (
					<>
						<div className="grid gap-4 md:grid-cols-3">
							<Card>
								<CardHeader><CardTitle>Total de escolas</CardTitle></CardHeader>
								<CardContent className="text-2xl font-semibold">
									{loadingOverview ? <Skeleton className="h-7 w-12" /> : (overview?.totals.schools ?? 0)}
								</CardContent>
							</Card>
							<Card>
								<CardHeader><CardTitle>Total de usuários</CardTitle></CardHeader>
								<CardContent className="text-2xl font-semibold">
									{loadingOverview ? <Skeleton className="h-7 w-12" /> : (overview?.totals.users ?? 0)}
								</CardContent>
							</Card>
							<Card>
								<CardHeader><CardTitle>Receita mensal estimada</CardTitle></CardHeader>
								<CardContent className="text-2xl font-semibold">
									{loadingOverview ? <Skeleton className="h-7 w-24" /> : `R$ ${(overview?.totals.revenue ?? 0).toFixed(2)}`}
								</CardContent>
							</Card>
						</div>

						<Card>
							<CardHeader><CardTitle>Planos por usuários</CardTitle></CardHeader>
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
										{(overview?.planStats ?? []).map((row) => (
											<TableRow key={row.plan_type}>
												<TableCell>{row.plan_type}</TableCell>
												<TableCell>{row.total_users}</TableCell>
												<TableCell>R$ {Number(row.monthly_revenue).toFixed(2)}</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</CardContent>
						</Card>

						<Card>
							<CardHeader><CardTitle>Escolas</CardTitle></CardHeader>
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
										{(overview?.schools ?? []).map((s) => (
											<TableRow key={s.id}>
												<TableCell>{s.name}</TableCell>
												<TableCell>{s.plan_type}</TableCell>
												<TableCell>R$ {Number(s.plan_price).toFixed(2)}</TableCell>
												<TableCell>{Number(s.user_count)}</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</CardContent>
						</Card>
					</>
				)}

				{/* ── Users table ── */}
				<Card>
					<CardHeader><CardTitle>Usuários</CardTitle></CardHeader>
					<CardContent className="space-y-4">

						{/* Filter bar */}
						<div className="flex flex-wrap items-center gap-2">

							{/* School combobox — SUPER_ADMIN only */}
							{isSuperAdmin && (
								<Popover open={filterSchoolOpen} onOpenChange={setFilterSchoolOpen}>
									<PopoverTrigger asChild>
										<Button
											variant="outline"
											role="combobox"
											aria-expanded={filterSchoolOpen}
											className="w-52 justify-between font-normal"
										>
											<span className="truncate">
												{filterSchoolId
													? (schools.find((s) => s.id === filterSchoolId)?.name ?? "Escola…")
													: "Todas as escolas"}
											</span>
											<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
										</Button>
									</PopoverTrigger>
									<PopoverContent className="w-52 p-0" align="start">
										<Command>
											<CommandInput
												placeholder="Buscar escola..."
												value={filterSchoolSearch}
												onValueChange={setFilterSchoolSearch}
											/>
											<CommandList>
												<CommandEmpty>Nenhuma escola encontrada.</CommandEmpty>
												<CommandGroup>
													<CommandItem
														value="__all__"
														onSelect={() => void handleSelectSchool(null)}
													>
														<Check className={cn("mr-2 h-4 w-4", filterSchoolId === null ? "opacity-100" : "opacity-0")} />
														Todas as escolas
													</CommandItem>
													{schools
														.filter((s) =>
															!filterSchoolSearch ||
															s.name.toLowerCase().includes(filterSchoolSearch.toLowerCase()),
														)
														.map((s) => (
															<CommandItem
																key={s.id}
																value={s.name}
																onSelect={() => void handleSelectSchool(s.id)}
															>
																<Check className={cn("mr-2 h-4 w-4", filterSchoolId === s.id ? "opacity-100" : "opacity-0")} />
																{s.name}
															</CommandItem>
														))}
												</CommandGroup>
											</CommandList>
										</Command>
									</PopoverContent>
								</Popover>
							)}

							{/* Classroom combobox — appears when school is selected (or always for ADMIN) */}
							{(filterSchoolId !== null || !isSuperAdmin) && (
								<Popover open={filterClassroomOpen} onOpenChange={setFilterClassroomOpen}>
									<PopoverTrigger asChild>
										<Button
											variant="outline"
											role="combobox"
											aria-expanded={filterClassroomOpen}
											className="w-48 justify-between font-normal"
										>
											<span className="truncate">
												{filterClassroomId
													? (classrooms.find((c) => c.id === filterClassroomId)?.name ?? "Turma…")
													: "Todas as turmas"}
											</span>
											<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
										</Button>
									</PopoverTrigger>
									<PopoverContent className="w-48 p-0" align="start">
										<Command>
											<CommandInput
												placeholder="Buscar turma..."
												value={filterClassroomSearch}
												onValueChange={setFilterClassroomSearch}
											/>
											<CommandList>
												<CommandEmpty>Nenhuma turma encontrada.</CommandEmpty>
												<CommandGroup>
													<CommandItem
														value="__all__"
														onSelect={() => void handleSelectClassroom(null)}
													>
														<Check className={cn("mr-2 h-4 w-4", filterClassroomId === null ? "opacity-100" : "opacity-0")} />
														Todas as turmas
													</CommandItem>
													{classrooms
														.filter((c) =>
															!filterClassroomSearch ||
															c.name.toLowerCase().includes(filterClassroomSearch.toLowerCase()),
														)
														.map((c) => (
															<CommandItem
																key={c.id}
																value={c.name}
																onSelect={() => void handleSelectClassroom(c.id)}
															>
																<Check className={cn("mr-2 h-4 w-4", filterClassroomId === c.id ? "opacity-100" : "opacity-0")} />
																{c.name}
															</CommandItem>
														))}
												</CommandGroup>
											</CommandList>
										</Command>
									</PopoverContent>
								</Popover>
							)}

							{/* User search */}
							<div className="relative flex-1 min-w-48">
								<Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
								<Input
									placeholder="Buscar por nome ou email..."
									value={userSearch}
									onChange={(e) => setUserSearch(e.target.value)}
									className="pl-8"
								/>
							</div>

							{/* Clear all */}
							{hasActiveFilter && (
								<Button variant="ghost" size="sm" onClick={clearFilters}>
									<X className="mr-1 h-3.5 w-3.5" />
									Limpar
								</Button>
							)}
						</div>

						{/* Result count */}
						{hasActiveFilter && (
							<p className="text-xs text-muted-foreground">
								{displayedUsers.length} usuário{displayedUsers.length !== 1 ? "s" : ""} encontrado{displayedUsers.length !== 1 ? "s" : ""}
							</p>
						)}

						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Nome</TableHead>
									<TableHead>Email</TableHead>
									<TableHead>Perfil</TableHead>
									<TableHead>Status</TableHead>
									{!isSuperAdmin && <TableHead>Ativar/Desativar</TableHead>}
									{!isSuperAdmin && <TableHead>Perfil</TableHead>}
									{isSuperAdmin && <TableHead>Plano</TableHead>}
									{isSuperAdmin && <TableHead>Escola</TableHead>}
									{isSuperAdmin && <TableHead>Ações</TableHead>}
								</TableRow>
							</TableHeader>
							<TableBody>
								{loadingOverview ? (
									Array.from({ length: 5 }).map((_, i) => (
										// biome-ignore lint/suspicious/noArrayIndexKey: skeleton rows have no identity
										<TableRow key={i}>
											{Array.from({ length: isSuperAdmin ? 7 : 6 }).map((__, j) => (
												// biome-ignore lint/suspicious/noArrayIndexKey: skeleton cells have no identity
												<TableCell key={j}>
													<Skeleton className="h-4 w-full" />
												</TableCell>
											))}
										</TableRow>
									))
								) : displayedUsers.length === 0 ? (
									<TableRow>
										<TableCell colSpan={isSuperAdmin ? 7 : 6} className="text-center text-muted-foreground py-8">
											Nenhum usuário encontrado.
										</TableCell>
									</TableRow>
								) : (
									displayedUsers.map((u) => (
										<TableRow key={u.id} className={!u.active ? "opacity-50" : ""}>
											<TableCell>{u.name}</TableCell>
											<TableCell className="text-sm">{u.email}</TableCell>
											<TableCell><Badge variant="outline">{u.role}</Badge></TableCell>
											<TableCell>
												<Badge variant={u.active ? "default" : "secondary"}>
													{u.active ? "Ativo" : "Inativo"}
												</Badge>
											</TableCell>

											{/* ADMIN: toggle active */}
											{!isSuperAdmin && (
												<TableCell>
													<Switch
														checked={u.active}
														disabled={savingUserId === u.id || u.role === "ADMIN"}
														onCheckedChange={(c) => void handleToggleActive(u.id, c)}
													/>
												</TableCell>
											)}

											{/* ADMIN: change role */}
											{!isSuperAdmin && (
												<TableCell>
													<select
														value={u.role}
														disabled={savingUserId === u.id}
														onChange={(e) =>
															void handleChangeRole(u.id, e.target.value as "ADMIN" | "PROFESSOR" | "ALUNO")
														}
														className="rounded border border-border bg-background px-2 py-1 text-sm"
													>
														<option value="ADMIN">ADMIN</option>
														<option value="PROFESSOR">PROFESSOR</option>
														<option value="ALUNO">ALUNO</option>
													</select>
												</TableCell>
											)}

											{/* SUPER_ADMIN: change plan */}
											{isSuperAdmin && (
												<TableCell>
													<div className="flex items-center gap-2">
														<select
															value={planDrafts[u.id] ?? u.plan_type}
															onChange={(e) =>
																setPlanDrafts((prev) => ({
																	...prev,
																	[u.id]: e.target.value as "FREE" | "INDIVIDUAL" | "ESCOLAR",
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
															onClick={() => void handleUpdatePlan(u.id)}
															disabled={savingUserId === u.id}
														>
															{savingUserId === u.id ? "…" : "Salvar"}
														</Button>
													</div>
												</TableCell>
											)}

											{/* SUPER_ADMIN: school */}
											{isSuperAdmin && (
												<TableCell>{u.school_name ?? "Sem escola"}</TableCell>
											)}

											{/* SUPER_ADMIN: edit */}
											{isSuperAdmin && (
												<TableCell>
													<Button size="sm" variant="outline" onClick={() => openEdit(u)}>
														Editar
													</Button>
												</TableCell>
											)}
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</CardContent>
				</Card>
			</div>

			{/* ── SUPER_ADMIN edit modal ── */}
			{isSuperAdmin && editingUser && editDraft && (
				<Dialog open={!!editingUser} onOpenChange={(open) => { if (!open) { setEditingUser(null); setEditDraft(null); } }}>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Editar usuário — {editingUser.name}</DialogTitle>
						</DialogHeader>
						<div className="space-y-3 text-sm">
							<div>
								<label htmlFor={`${editId}-name`} className="block text-muted-foreground">Nome</label>
								<input
									id={`${editId}-name`}
									className="mt-1 w-full rounded border border-border bg-background px-3 py-2"
									value={editDraft.name}
									onChange={(e) => setEditDraft((d) => d && { ...d, name: e.target.value })}
								/>
							</div>
							<div>
								<label htmlFor={`${editId}-email`} className="block text-muted-foreground">Email</label>
								<input
									id={`${editId}-email`}
									type="email"
									className="mt-1 w-full rounded border border-border bg-background px-3 py-2"
									value={editDraft.email}
									onChange={(e) => setEditDraft((d) => d && { ...d, email: e.target.value })}
								/>
							</div>
							<div>
								<label htmlFor={`${editId}-role`} className="block text-muted-foreground">Perfil</label>
								<select
									id={`${editId}-role`}
									className="mt-1 w-full rounded border border-border bg-background px-3 py-2"
									value={editDraft.role}
									onChange={(e) => setEditDraft((d) => d && { ...d, role: e.target.value as "ADMIN" | "PROFESSOR" | "ALUNO" })}
								>
									<option value="ADMIN">ADMIN</option>
									<option value="PROFESSOR">PROFESSOR</option>
									<option value="ALUNO">ALUNO</option>
								</select>
							</div>
							<div>
								<label htmlFor={`${editId}-plan`} className="block text-muted-foreground">Plano</label>
								<select
									id={`${editId}-plan`}
									className="mt-1 w-full rounded border border-border bg-background px-3 py-2"
									value={editDraft.planType}
									onChange={(e) => setEditDraft((d) => d && { ...d, planType: e.target.value as "FREE" | "INDIVIDUAL" | "ESCOLAR" })}
								>
									<option value="FREE">FREE</option>
									<option value="INDIVIDUAL">INDIVIDUAL</option>
									<option value="ESCOLAR">ESCOLAR</option>
								</select>
							</div>
							<div>
								<p className="text-muted-foreground mb-1">Escola</p>
								<Popover open={schoolPickerOpen} onOpenChange={setSchoolPickerOpen}>
									<PopoverTrigger asChild>
										<Button
											variant="outline"
											role="combobox"
											aria-label="Selecionar escola"
											aria-expanded={schoolPickerOpen}
											className="w-full justify-between font-normal"
										>
											<span className="truncate">
												{editDraft.schoolId
													? (schools.find((s) => s.id === editDraft.schoolId)?.name ?? `Escola ${editDraft.schoolId}`)
													: "Sem escola"}
											</span>
											<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
										</Button>
									</PopoverTrigger>
									<PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
										<Command>
											<CommandInput
												placeholder="Buscar escola..."
												value={schoolSearch}
												onValueChange={setSchoolSearch}
											/>
											<CommandList>
												<CommandEmpty>Nenhuma escola encontrada.</CommandEmpty>
												<CommandGroup>
													<CommandItem
														value="__none__"
														onSelect={() => { setEditDraft((d) => d && { ...d, schoolId: null }); setSchoolPickerOpen(false); }}
													>
														<Check className={cn("mr-2 h-4 w-4", editDraft.schoolId === null ? "opacity-100" : "opacity-0")} />
														Sem escola
													</CommandItem>
													{schools
														.filter((s) => !schoolSearch || s.name.toLowerCase().includes(schoolSearch.toLowerCase()))
														.map((s) => (
															<CommandItem
																key={s.id}
																value={s.name}
																onSelect={() => { setEditDraft((d) => d && { ...d, schoolId: s.id }); setSchoolPickerOpen(false); setSchoolSearch(""); }}
															>
																<Check className={cn("mr-2 h-4 w-4", editDraft.schoolId === s.id ? "opacity-100" : "opacity-0")} />
																{s.name}
															</CommandItem>
														))}
												</CommandGroup>
											</CommandList>
										</Command>
									</PopoverContent>
								</Popover>
							</div>
							<div className="flex justify-end gap-2 pt-2">
								<Button variant="outline" onClick={() => { setEditingUser(null); setEditDraft(null); }}>
									Cancelar
								</Button>
								<Button onClick={() => void handleSaveEdit()} disabled={savingEdit}>
									{savingEdit ? "Salvando..." : "Salvar"}
								</Button>
							</div>
						</div>
					</DialogContent>
				</Dialog>
			)}
		</main>
	);
}
