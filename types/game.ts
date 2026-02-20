export type StudyRequirement = "BAIXO" | "MEDIO" | "ALTO" | "MUITO_ALTO";
export type ProfessionType = "IMEDIATO" | "EQUILIBRADO" | "LONGO_PRAZO";

export interface Profession {
  id: string;
  name: string;
  description: string;
  baseSalary: number;
  studyRequirement: StudyRequirement;
  growthMultiplier: number;
  type: ProfessionType;
  icon: string;
  minKnowledgeForBonus: number;
}

export interface PlayerStats {
  money: number;
  knowledge: number;
  happiness: number;
  energy: number;
  health: number;
}

export interface GameSession {
  id: number;
  user_id: number;
  character_name: string;
  profession_id: string;
  current_day: number;
  money: number;
  knowledge: number;
  happiness: number;
  energy: number;
  health: number;
  status: "ACTIVE" | "COMPLETED";
  started_at: string;
  updated_at: string;
}

export type EventCategory =
  | "TRABALHO"
  | "ESTUDO"
  | "LAZER"
  | "INVESTIMENTO"
  | "ALEATORIO"
  | "PAGAMENTO";

export interface StatEffects {
  money?: number;
  knowledge?: number;
  happiness?: number;
  energy?: number;
  health?: number;
}

export interface EventOption {
  id: string;
  label: string;
  description: string;
  requiresDice: false | 1 | 2;
  effects: StatEffects;
  diceThreshold?: number;
  successEffects?: StatEffects;
  failureEffects?: StatEffects;
}

export interface GameEvent {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  icon: string;
  options: EventOption[];
  triggerCondition?: (day: number, stats: PlayerStats) => boolean;
}

export interface DiceResult {
  values: number[];
  total: number;
  isSuccess: boolean;
}

export interface DayLog {
  id: number;
  game_session_id: number;
  day: number;
  event_type: string;
  event_title: string;
  choice_made: string | null;
  dice_result: number | null;
  effects_applied: StatEffects;
  created_at: string;
}

export interface GameConfig {
  TOTAL_DAYS: number;
  STARTING_MONEY: number;
  STARTING_KNOWLEDGE: number;
  STARTING_HAPPINESS: number;
  STARTING_ENERGY: number;
  STARTING_HEALTH: number;
  SALARY_DAY_INTERVAL: number;
  LOW_HAPPINESS_THRESHOLD: number;
  LOW_ENERGY_THRESHOLD: number;
  LOW_HEALTH_THRESHOLD: number;
}
