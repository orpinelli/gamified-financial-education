"use client";

import Link from "next/link";
import { useState } from "react";
import type { AuthUser, PlanType } from "@/types/user";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface AppHeaderProps {
	user: AuthUser;
	onLogout: () => Promise<void>;
	onPlanUpdated: (planType: PlanType) => void;
}

export function AppHeader({ user, onLogout, onPlanUpdated }: AppHeaderProps) {
	const [planDraft, setPlanDraft] = useState<PlanType>(user.planType);
	const [loadingPlan, setLoadingPlan] = useState(false);
	const publicSuperAdmins = (process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAILS ?? "")
		.split(",")
		.map((email) => email.trim().toLowerCase())
		.filter(Boolean);
	const isSuperAdmin = publicSuperAdmins.includes(user.email.toLowerCase());
	const isSchoolStaff =
		user.planType === "ESCOLAR" &&
		(user.role === "ADMIN" || user.role === "PROFESSOR");

	const planLabel = user.planType === "INDIVIDUAL" ? "PLUS" : user.planType;

	async function savePlan() {
		setLoadingPlan(true);
		try {
			const response = await fetch("/api/account/plan", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ planType: planDraft }),
			});
			const data = (await response.json()) as { user?: { planType: PlanType } };
			if (response.ok && data.user?.planType) {
				onPlanUpdated(data.user.planType);
			}
		} finally {
			setLoadingPlan(false);
		}
	}

	return (
		<header className="rounded-lg border border-border bg-card p-4">
			<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
				<div className="space-y-1">
					<p className="text-sm font-medium">{user.name}</p>
					<p className="text-xs text-muted-foreground">{user.email}</p>
					<div className="flex items-center gap-2">
						<Badge variant="secondary">{user.role}</Badge>
						{user.role !== "ALUNO" ? (
							<Badge variant="outline">{planLabel}</Badge>
						) : null}
					</div>
				</div>

				<nav className="flex flex-wrap items-center gap-2 text-sm">
					<Button variant="ghost" asChild size="sm">
						<Link href="/home">Início</Link>
					</Button>
					<Button variant="ghost" asChild size="sm">
						<Link href="/game">Jogar</Link>
					</Button>
					<Button variant="ghost" asChild size="sm">
						<Link href="/aulas">Aulas</Link>
					</Button>
					<Button variant="ghost" asChild size="sm">
						<Link href="/conta">Dados pessoais</Link>
					</Button>
					{isSchoolStaff ? (
						<Button variant="ghost" asChild size="sm">
							<Link href="/turmas">Turmas</Link>
						</Button>
					) : null}
					{user.role === "ADMIN" ? (
						<Button variant="ghost" asChild size="sm">
							<Link href="/dashboard">Admin</Link>
						</Button>
					) : null}
				</nav>

				<div className="flex flex-wrap items-center gap-2">
					{isSuperAdmin ? (
						<>
							<select
								value={planDraft}
								onChange={(event) =>
									setPlanDraft(event.target.value as PlanType)
								}
								className="rounded-md border border-border bg-background px-2 py-1 text-sm"
							>
								<option value="FREE">FREE</option>
								<option value="INDIVIDUAL">PLUS</option>
								<option value="ESCOLAR">ESCOLAR</option>
							</select>
							<Button
								variant="outline"
								size="sm"
								onClick={savePlan}
								disabled={loadingPlan}
							>
								{loadingPlan ? "Salvando..." : "Alterar plano"}
							</Button>
						</>
					) : null}
					<Button variant="outline" size="sm" onClick={onLogout}>
						Sair
					</Button>
				</div>
			</div>
		</header>
	);
}
