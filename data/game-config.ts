import type { GameConfig } from "@/types/game";

export const GAME_CONFIG: GameConfig = {
  TOTAL_DAYS: 365,
  STARTING_MONEY: 500,
  STARTING_KNOWLEDGE: 20,
  STARTING_HAPPINESS: 70,
  STARTING_ENERGY: 100,
  STARTING_HEALTH: 100,
  SALARY_DAY_INTERVAL: 30,
  LOW_HAPPINESS_THRESHOLD: 20,
  LOW_ENERGY_THRESHOLD: 10,
  LOW_HEALTH_THRESHOLD: 15,
};

export const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Marco",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];

export function getDayMonth(day: number): { month: number; dayOfMonth: number } {
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let remaining = day;
  for (let i = 0; i < daysInMonth.length; i++) {
    if (remaining <= daysInMonth[i]) {
      return { month: i, dayOfMonth: remaining };
    }
    remaining -= daysInMonth[i];
  }
  return { month: 11, dayOfMonth: 31 };
}

export function getMonthDays(month: number): number {
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return daysInMonth[month] ?? 30;
}

export function getDayOfWeek(day: number): number {
  return (day - 1) % 7;
}

export function getFirstDayOfMonth(month: number): number {
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let total = 1;
  for (let i = 0; i < month; i++) {
    total += daysInMonth[i];
  }
  return total;
}
