"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/containers/auth/hooks/useAuth";
import { AppHeader } from "@/src/shared/components/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const MODULES = [
	{
		id: "mod-1",
		title: "Módulo 1 · Fundamentos financeiros",
		lessons: [
			"Aula 1: Organização de renda e despesas",
			"Aula 2: Reserva de emergência",
			"Aula 3: Juros simples e compostos",
		],
	},
	{
		id: "mod-2",
		title: "Módulo 2 · Consumo consciente",
		lessons: [
			"Aula 1: Dívidas e negociação",
			"Aula 2: Planejamento de compras",
			"Aula 3: Metas de curto prazo",
		],
	},
	{
		id: "mod-3",
		title: "Módulo 3 · Investimentos iniciais",
		lessons: [
			"Aula 1: Perfil de risco",
			"Aula 2: Renda fixa vs variável",
			"Aula 3: Estratégia de longo prazo",
		],
	},
];

export default function AulasPage() {
	const router = useRouter();
	const { user, isLoading, logout, mutate } = useAuth();

	useEffect(() => {
		if (!isLoading && !user) {
			router.push("/login");
		}
	}, [isLoading, router, user]);

	if (isLoading || !user) {
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
						<CardTitle>
							Biblioteca de aulas (estrutura estilo módulos)
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<p className="text-sm text-muted-foreground">
							Estrutura pronta para você publicar conteúdo em breve, no formato
							módulo → aulas (similar ao padrão de plataformas como Hotmart).
						</p>
						<div className="space-y-3">
							{MODULES.map((module) => (
								<div
									key={module.id}
									className="rounded-md border border-border p-3"
								>
									<h3 className="font-medium">{module.title}</h3>
									<ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
										{module.lessons.map((lesson) => (
											<li key={lesson}>{lesson}</li>
										))}
									</ul>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			</div>
		</main>
	);
}
