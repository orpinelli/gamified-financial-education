"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/containers/auth/hooks/useAuth";
import { AppHeader } from "@/src/shared/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ContaPage() {
	const router = useRouter();
	const { user, isLoading, logout, mutate } = useAuth();
	const [deleting, setDeleting] = useState(false);

	useEffect(() => {
		if (!isLoading && !user) {
			router.push("/login");
		}
	}, [isLoading, router, user]);

	if (isLoading || !user) {
		return null;
	}

	async function deleteAccount() {
		const confirmed = window.confirm(
			"Tem certeza que deseja excluir sua conta? Esta ação não pode ser desfeita.",
		);

		if (!confirmed) {
			return;
		}

		setDeleting(true);
		try {
			const response = await fetch("/api/account/delete", { method: "DELETE" });
			if (response.ok) {
				await mutate({ user: null }, false);
				router.push("/login");
			}
		} finally {
			setDeleting(false);
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
					<CardHeader>
						<CardTitle>Dados pessoais</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2 text-sm">
						<p>
							<strong>Nome:</strong> {user.name}
						</p>
						<p>
							<strong>Email:</strong> {user.email}
						</p>
						<p>
							<strong>Perfil:</strong> {user.role}
						</p>
						<p>
							<strong>Plano:</strong> {user.planType}
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Zona de risco</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<p className="text-sm text-muted-foreground">
							Ao excluir sua conta, seus dados e progresso serão removidos.
						</p>
						<div className="pt-2">
							<Button
								variant="destructive"
								onClick={deleteAccount}
								disabled={deleting}
								className="w-full md:w-auto"
							>
								{deleting ? "Excluindo conta..." : "Excluir conta"}
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		</main>
	);
}
