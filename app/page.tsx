import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Home() {
	return (
		<main className="min-h-screen bg-background text-foreground">
			<section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-16">
				<div className="space-y-4 text-center">
					<Badge>FinQuest</Badge>
					<h1 className="text-4xl font-bold tracking-tight md:text-5xl">
						Educação financeira gamificada para alunos e escolas
					</h1>
					<p className="mx-auto max-w-2xl text-muted-foreground">
						O FinQuest transforma conteúdos de finanças em uma jornada estilo
						RPG, com progressão, desafios e acompanhamento para professores e
						gestão escolar.
					</p>
					<div className="flex items-center justify-center gap-3 pt-2">
						<Button asChild>
							<Link href="/login">Entrar ou criar conta</Link>
						</Button>
						<Button asChild variant="outline">
							<Link href="/game">Ir para o jogo</Link>
						</Button>
					</div>
				</div>

				<div className="grid gap-4 md:grid-cols-3">
					<Card>
						<CardHeader>
							<CardTitle>Plano Free</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3">
							<p className="text-2xl font-semibold">R$ 0,00</p>
							<p className="text-sm text-muted-foreground">
								Para começar sem custo, com anúncios em vídeo e banners durante
								o uso da plataforma.
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Plano Individual</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3">
							<p className="text-2xl font-semibold">R$ 4,99/mês</p>
							<p className="text-sm text-muted-foreground">
								Ideal para uso pessoal, sem anúncios e com a experiência
								completa de aprendizagem.
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Plano Escolar</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3">
							<p className="text-2xl font-semibold">R$ 399,00/mês</p>
							<p className="text-sm text-muted-foreground">
								Gestão de escola com turmas, acompanhamento de alunos e painel
								administrativo completo.
							</p>
						</CardContent>
					</Card>
				</div>

				<section className="rounded-lg border border-border p-6">
					<h2 className="text-xl font-semibold">Proposta do projeto</h2>
					<p className="mt-3 text-muted-foreground">
						Nossa proposta é aumentar o engajamento em educação financeira com
						mecânicas de jogo, ao mesmo tempo em que escolas e gestores
						acompanham evolução, planos e adesão dos usuários em um dashboard
						centralizado.
					</p>
				</section>
			</section>
		</main>
	);
}
