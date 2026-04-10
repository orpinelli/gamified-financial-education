"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type AvatarConfig = {
	characterName: string;
	avatarHair: string;
	avatarSkin: string;
	avatarOutfit: string;
};

const HAIR_OPTIONS = [
	{ id: "curto", label: "Curto", emoji: "💇" },
	{ id: "longo", label: "Longo", emoji: "👱" },
	{ id: "cacheado", label: "Cacheado", emoji: "🧑‍🦱" },
	{ id: "careca", label: "Careca", emoji: "🧑‍🦲" },
	{ id: "tranca", label: "Trança", emoji: "👩‍🦱" },
];

const SKIN_OPTIONS = [
	{ id: "claro", label: "Claro", color: "#FDDBB4" },
	{ id: "medio", label: "Médio", color: "#D4956A" },
	{ id: "moreno", label: "Moreno", color: "#A0522D" },
	{ id: "escuro", label: "Escuro", color: "#4A2C17" },
];

const OUTFIT_OPTIONS = [
	{ id: "casual", label: "Casual", emoji: "👕" },
	{ id: "formal", label: "Formal", emoji: "👔" },
	{ id: "esportivo", label: "Esportivo", emoji: "🏃" },
	{ id: "artistico", label: "Artístico", emoji: "🎨" },
	{ id: "universitario", label: "Universitário", emoji: "🎓" },
];

// Simple emoji-based avatar preview
function AvatarPreview({ config }: { config: AvatarConfig }) {
	const outfit = OUTFIT_OPTIONS.find((o) => o.id === config.avatarOutfit);
	const hair = HAIR_OPTIONS.find((h) => h.id === config.avatarHair);

	return (
		<div className="flex flex-col items-center gap-1">
			<div className="relative flex h-24 w-24 flex-col items-center justify-center rounded-full border-4 border-primary bg-background text-4xl shadow-lg">
				<span>{hair?.emoji ?? "🧑"}</span>
				<span className="text-xl">{outfit?.emoji ?? "👕"}</span>
			</div>
			<p className="text-sm font-medium text-muted-foreground">
				{config.characterName || "Seu personagem"}
			</p>
		</div>
	);
}

interface AvatarCreatorProps {
	onStart: (config: AvatarConfig) => Promise<void>;
	isSubmitting: boolean;
}

export function AvatarCreator({ onStart, isSubmitting }: AvatarCreatorProps) {
	const [config, setConfig] = useState<AvatarConfig>({
		characterName: "",
		avatarHair: "curto",
		avatarSkin: "medio",
		avatarOutfit: "casual",
	});

	const set = (key: keyof AvatarConfig, value: string) =>
		setConfig((prev) => ({ ...prev, [key]: value }));

	return (
		<Card className="mx-auto w-full max-w-xl">
			<CardHeader>
				<CardTitle>Crie seu personagem</CardTitle>
			</CardHeader>
			<CardContent className="space-y-6">
				{/* Preview */}
				<div className="flex justify-center">
					<AvatarPreview config={config} />
				</div>

				{/* Name */}
				<div className="space-y-2">
					<label className="text-sm font-medium">Nome do personagem</label>
					<Input
						placeholder="Digite o nome..."
						value={config.characterName}
						onChange={(e) => set("characterName", e.target.value)}
						maxLength={40}
					/>
				</div>

				{/* Hair */}
				<div className="space-y-2">
					<label className="text-sm font-medium">Cabelo</label>
					<div className="flex flex-wrap gap-2">
						{HAIR_OPTIONS.map((h) => (
							<button
								key={h.id}
								type="button"
								onClick={() => set("avatarHair", h.id)}
								className={[
									"flex flex-col items-center rounded-lg border-2 p-2 text-xs transition-colors",
									config.avatarHair === h.id
										? "border-primary bg-primary/10"
										: "border-border hover:border-primary/50",
								].join(" ")}
							>
								<span className="text-xl">{h.emoji}</span>
								<span>{h.label}</span>
							</button>
						))}
					</div>
				</div>

				{/* Skin */}
				<div className="space-y-2">
					<label className="text-sm font-medium">Tom de pele</label>
					<div className="flex gap-3">
						{SKIN_OPTIONS.map((s) => (
							<button
								key={s.id}
								type="button"
								onClick={() => set("avatarSkin", s.id)}
								title={s.label}
								className={[
									"h-10 w-10 rounded-full border-4 transition-transform",
									config.avatarSkin === s.id
										? "scale-110 border-primary"
										: "border-transparent hover:border-primary/50",
								].join(" ")}
								style={{ backgroundColor: s.color }}
							/>
						))}
					</div>
				</div>

				{/* Outfit */}
				<div className="space-y-2">
					<label className="text-sm font-medium">Roupa</label>
					<div className="flex flex-wrap gap-2">
						{OUTFIT_OPTIONS.map((o) => (
							<button
								key={o.id}
								type="button"
								onClick={() => set("avatarOutfit", o.id)}
								className={[
									"flex flex-col items-center rounded-lg border-2 p-2 text-xs transition-colors",
									config.avatarOutfit === o.id
										? "border-primary bg-primary/10"
										: "border-border hover:border-primary/50",
								].join(" ")}
							>
								<span className="text-xl">{o.emoji}</span>
								<span>{o.label}</span>
							</button>
						))}
					</div>
				</div>

				<Button
					className="w-full"
					disabled={isSubmitting || !config.characterName.trim()}
					onClick={() => void onStart(config)}
				>
					{isSubmitting ? "Criando..." : "Começar jornada"}
				</Button>
			</CardContent>
		</Card>
	);
}
