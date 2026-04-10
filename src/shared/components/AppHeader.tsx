"use client";

import Link from "next/link";
import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AuthUser, PlanType } from "@/types/user";

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

	const initials = user.name
		.split(" ")
		.slice(0, 2)
		.map((w) => w[0])
		.join("")
		.toUpperCase();

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
			<div className="flex items-center justify-between gap-3">
				<nav className="flex flex-wrap items-center gap-1 text-sm">
					<Button variant="ghost" asChild size="sm">
						<Link href="/home">Início</Link>
					</Button>
					<Button variant="ghost" asChild size="sm">
						<Link href="/game">Jogar</Link>
					</Button>
					<Button variant="ghost" asChild size="sm">
						<Link href="/aulas">Aulas</Link>
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

				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" className="h-9 w-9 rounded-full p-0">
							<Avatar className="h-9 w-9">
								<AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
									{initials}
								</AvatarFallback>
							</Avatar>
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-60">
						<DropdownMenuLabel className="pb-1">
							<p className="font-medium leading-tight">{user.name}</p>
							<p className="text-xs text-muted-foreground font-normal truncate">
								{user.email}
							</p>
							<div className="flex items-center gap-2 mt-1">
								<Badge variant="secondary" className="text-xs">{user.role}</Badge>
								{user.role !== "ALUNO" ? (
									<Badge variant="outline" className="text-xs">
										{user.planType === "INDIVIDUAL" ? "PLUS" : user.planType}
									</Badge>
								) : null}
							</div>
						</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<DropdownMenuItem asChild>
							<Link href="/conta">Dados pessoais</Link>
						</DropdownMenuItem>
						{user.role === "ALUNO" && user.planType === "ESCOLAR" ? (
							<DropdownMenuItem asChild>
								<Link href="/home#turmas">Ranking</Link>
							</DropdownMenuItem>
						) : null}
						{isSuperAdmin ? (
							<>
								<DropdownMenuSeparator />
								<div className="px-2 py-1.5 flex items-center gap-2">
									<select
										value={planDraft}
										onChange={(event) =>
											setPlanDraft(event.target.value as PlanType)
										}
										className="flex-1 rounded-md border border-border bg-background px-2 py-1 text-xs"
									>
										<option value="FREE">FREE</option>
										<option value="INDIVIDUAL">PLUS</option>
										<option value="ESCOLAR">ESCOLAR</option>
									</select>
									<Button
										variant="outline"
										size="sm"
										className="text-xs h-7 px-2"
										onClick={savePlan}
										disabled={loadingPlan}
									>
										{loadingPlan ? "..." : "Alterar"}
									</Button>
								</div>
							</>
						) : null}
						<DropdownMenuSeparator />
						<DropdownMenuItem
							className="text-destructive focus:text-destructive"
							onClick={() => void onLogout()}
						>
							Sair
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</header>
	);
}
