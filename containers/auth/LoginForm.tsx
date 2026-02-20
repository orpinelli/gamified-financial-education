"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Sword, Shield, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { useAuth } from "./hooks/useAuth";

export function LoginForm() {
	const emailId = useId();
	const passwordId = useId();
	const registerNameId = useId();
	const registerEmailId = useId();
	const registerPasswordId = useId();
	const registerSchoolId = useId();
	const registerInviteId = useId();

	const [activeTab, setActiveTab] = useState<"login" | "register">("login");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [registerName, setRegisterName] = useState("");
	const [registerEmail, setRegisterEmail] = useState("");
	const [registerPassword, setRegisterPassword] = useState("");
	const [registerInviteCode, setRegisterInviteCode] = useState("");
	const [registerPlan, setRegisterPlan] = useState<
		"FREE" | "INDIVIDUAL" | "ESCOLAR"
	>("FREE");
	const [schoolName, setSchoolName] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [errorMsg, setErrorMsg] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const { login, register } = useAuth();
	const router = useRouter();

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setErrorMsg("");
		setIsSubmitting(true);

		try {
			await login(email, password);
			router.push("/home");
		} catch (err: unknown) {
			const message =
				err instanceof Error ? err.message : "Erro ao fazer login";
			setErrorMsg(message);
		} finally {
			setIsSubmitting(false);
		}
	}

	async function handleRegister(e: React.FormEvent) {
		e.preventDefault();
		setErrorMsg("");
		setIsSubmitting(true);

		try {
			await register({
				name: registerName,
				email: registerEmail,
				password: registerPassword,
				planType: registerPlan,
				schoolName: registerPlan === "ESCOLAR" ? schoolName : undefined,
				inviteCode: registerInviteCode.trim() || undefined,
			});
			router.push("/home");
		} catch (err: unknown) {
			const message =
				err instanceof Error ? err.message : "Erro ao criar conta";
			setErrorMsg(message);
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-background p-4">
			<div className="w-full max-w-md">
				<div className="mb-8 flex flex-col items-center gap-3">
					<div className="flex items-center gap-2">
						<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
							<Sword className="h-7 w-7 text-primary-foreground" />
						</div>
						<h1 className="text-3xl font-bold tracking-tight text-foreground">
							FinQuest
						</h1>
					</div>
					<p className="text-center text-sm text-muted-foreground">
						RPG de Educacao Financeira
					</p>
					<Button variant="link" asChild className="h-auto p-0 text-sm">
						<Link href="/">Ver landing page</Link>
					</Button>
				</div>

				<Card className="border-border bg-card">
					<CardHeader className="text-center">
						<CardTitle className="flex items-center justify-center gap-2 text-lg text-card-foreground">
							<Shield className="h-5 w-5 text-primary" />
							Entrar na Plataforma
						</CardTitle>
						<CardDescription>Use suas credenciais para acessar</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="mb-4 grid grid-cols-2 gap-2">
							<Button
								type="button"
								variant={activeTab === "login" ? "default" : "outline"}
								onClick={() => setActiveTab("login")}
							>
								Entrar
							</Button>
							<Button
								type="button"
								variant={activeTab === "register" ? "default" : "outline"}
								onClick={() => setActiveTab("register")}
							>
								Criar conta
							</Button>
						</div>

						{activeTab === "login" ? (
							<form onSubmit={handleSubmit} className="flex flex-col gap-4">
								{errorMsg && (
									<div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
										{errorMsg}
									</div>
								)}
								<div className="flex flex-col gap-2">
									<Label htmlFor={emailId} className="text-foreground">
										Email
									</Label>
									<Input
										id={emailId}
										type="email"
										placeholder="seu@email.com"
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										required
										className="border-border bg-input text-foreground placeholder:text-muted-foreground"
									/>
								</div>
								<div className="flex flex-col gap-2">
									<Label htmlFor={passwordId} className="text-foreground">
										Senha
									</Label>
									<div className="relative">
										<Input
											id={passwordId}
											type={showPassword ? "text" : "password"}
											placeholder="Sua senha"
											value={password}
											onChange={(e) => setPassword(e.target.value)}
											required
											className="border-border bg-input pr-10 text-foreground placeholder:text-muted-foreground"
										/>
										<button
											type="button"
											onClick={() => setShowPassword(!showPassword)}
											className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
											aria-label={
												showPassword ? "Esconder senha" : "Mostrar senha"
											}
										>
											{showPassword ? (
												<EyeOff className="h-4 w-4" />
											) : (
												<Eye className="h-4 w-4" />
											)}
										</button>
									</div>
								</div>
								<Button
									type="submit"
									disabled={isSubmitting}
									className="mt-2 w-full"
								>
									{isSubmitting ? "Entrando..." : "Entrar"}
								</Button>
							</form>
						) : (
							<form onSubmit={handleRegister} className="flex flex-col gap-4">
								{errorMsg && (
									<div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
										{errorMsg}
									</div>
								)}
								<div className="flex flex-col gap-2">
									<Label htmlFor={registerNameId}>Nome</Label>
									<Input
										id={registerNameId}
										value={registerName}
										onChange={(e) => setRegisterName(e.target.value)}
										placeholder="Seu nome"
										required
									/>
								</div>

								<div className="flex flex-col gap-2">
									<Label htmlFor={registerEmailId}>Email</Label>
									<Input
										id={registerEmailId}
										type="email"
										value={registerEmail}
										onChange={(e) => setRegisterEmail(e.target.value)}
										placeholder="seu@email.com"
										required
									/>
								</div>

								<div className="flex flex-col gap-2">
									<Label htmlFor={registerPasswordId}>Senha</Label>
									<Input
										id={registerPasswordId}
										type="password"
										value={registerPassword}
										onChange={(e) => setRegisterPassword(e.target.value)}
										placeholder="Mínimo 6 caracteres"
										required
									/>
								</div>

								<div className="flex flex-col gap-2">
									<Label htmlFor={registerInviteId}>
										Código de convite da escola (opcional)
									</Label>
									<Input
										id={registerInviteId}
										value={registerInviteCode}
										onChange={(e) =>
											setRegisterInviteCode(e.target.value.toUpperCase())
										}
										placeholder="EX: AB12CD"
									/>
								</div>

								<div className="flex flex-col gap-2">
									<Label>Plano</Label>
									<Select
										value={registerPlan}
										onValueChange={(value) =>
											setRegisterPlan(
												value as "FREE" | "INDIVIDUAL" | "ESCOLAR",
											)
										}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="FREE">Free (com anúncios)</SelectItem>
											<SelectItem value="INDIVIDUAL">
												Individual - R$ 4,99/mês
											</SelectItem>
											<SelectItem value="ESCOLAR">
												Escolar - R$ 399,00/mês
											</SelectItem>
										</SelectContent>
									</Select>
								</div>

								{registerPlan === "ESCOLAR" && (
									<div className="flex flex-col gap-2">
										<Label htmlFor={registerSchoolId}>Nome da escola</Label>
										<Input
											id={registerSchoolId}
											value={schoolName}
											onChange={(e) => setSchoolName(e.target.value)}
											placeholder="Escola Exemplo"
											required
										/>
									</div>
								)}

								<Button
									type="submit"
									disabled={isSubmitting}
									className="mt-2 w-full"
								>
									{isSubmitting ? "Criando conta..." : "Criar conta"}
								</Button>
							</form>
						)}

						{activeTab === "login" && (
							<div className="mt-6 rounded-md border border-border bg-secondary/50 p-3">
								<p className="mb-2 text-xs font-medium text-muted-foreground">
									Contas demo (senha: senha123)
								</p>
								<div className="flex flex-col gap-1 text-xs text-muted-foreground">
									<span>Admin: admin@escola.com</span>
									<span>Professor: professor@escola.com</span>
									<span>Aluno: aluno@escola.com</span>
								</div>
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
