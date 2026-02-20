"use client";

import { useState } from "react";
import {
  ShoppingCart,
  Scissors,
  Monitor,
  Calculator,
  Heart,
  Wrench,
  Scale,
  Stethoscope,
  Sword,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PROFESSIONS } from "@/data/professions";
import type { Profession } from "@/types/game";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, React.ElementType> = {
  ShoppingCart,
  Scissors,
  Monitor,
  Calculator,
  Heart,
  Wrench,
  Scale,
  Stethoscope,
};

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  IMEDIATO: { label: "Imediato", color: "bg-game-gold text-accent-foreground" },
  EQUILIBRADO: { label: "Equilibrado", color: "bg-game-energy text-foreground" },
  LONGO_PRAZO: { label: "Longo Prazo", color: "bg-game-knowledge text-primary-foreground" },
};

const STUDY_LABELS: Record<string, string> = {
  BAIXO: "Baixo",
  MEDIO: "Medio",
  ALTO: "Alto",
  MUITO_ALTO: "Muito Alto",
};

interface CharacterCreationProps {
  onCreateCharacter: (name: string, professionId: string) => Promise<void>;
}

export function CharacterCreation({ onCreateCharacter }: CharacterCreationProps) {
  const [name, setName] = useState("");
  const [selectedProfession, setSelectedProfession] = useState<string>("");
  const [isCreating, setIsCreating] = useState(false);

  async function handleCreate() {
    if (!name.trim() || !selectedProfession) return;
    setIsCreating(true);
    try {
      await onCreateCharacter(name.trim(), selectedProfession);
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-start bg-background p-4 pt-8">
      <div className="mb-8 flex items-center gap-2">
        <Sword className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">FinQuest</h1>
      </div>

      <Card className="mb-6 w-full max-w-lg border-border bg-card">
        <CardHeader>
          <CardTitle className="text-card-foreground">Criar Personagem</CardTitle>
          <CardDescription>Escolha seu nome e profissao para comecar a jornada</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            <Label htmlFor="charName" className="text-foreground">
              Nome do Personagem
            </Label>
            <Input
              id="charName"
              placeholder="Digite o nome do seu personagem"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border-border bg-input text-foreground"
              maxLength={30}
            />
          </div>
        </CardContent>
      </Card>

      <div className="mb-6 w-full max-w-4xl">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Escolha sua Profissao</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {PROFESSIONS.map((prof: Profession) => {
            const IconComp = ICON_MAP[prof.icon] ?? Monitor;
            const typeInfo = TYPE_LABELS[prof.type];
            const isSelected = selectedProfession === prof.id;
            return (
              <button
                key={prof.id}
                type="button"
                onClick={() => setSelectedProfession(prof.id)}
                className={cn(
                  "flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-all",
                  isSelected
                    ? "border-primary bg-primary/10 ring-1 ring-primary"
                    : "border-border bg-card hover:border-primary/50"
                )}
              >
                <div className="flex w-full items-center justify-between">
                  <IconComp className={cn("h-6 w-6", isSelected ? "text-primary" : "text-muted-foreground")} />
                  <Badge className={cn("text-xs", typeInfo.color)}>{typeInfo.label}</Badge>
                </div>
                <h3 className="font-semibold text-card-foreground">{prof.name}</h3>
                <p className="text-xs leading-relaxed text-muted-foreground">{prof.description}</p>
                <div className="mt-auto flex w-full flex-col gap-1 border-t border-border pt-2 text-xs text-muted-foreground">
                  <span>Salario: R${prof.baseSalary.toLocaleString("pt-BR")}</span>
                  <span>Estudo: {STUDY_LABELS[prof.studyRequirement]}</span>
                  <span>Crescimento: x{prof.growthMultiplier}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <Button
        size="lg"
        disabled={!name.trim() || !selectedProfession || isCreating}
        onClick={handleCreate}
        className="gap-2"
      >
        {isCreating ? "Criando..." : "Iniciar Jornada"}
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
