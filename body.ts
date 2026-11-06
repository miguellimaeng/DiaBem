/* Cálculos corporais simples e descritivos (sem classificação diagnóstica). */
import type { UserProfile, WeightRecord } from '@/types/models';
import { parseLocalDate } from './date';

export function ageFrom(profile: UserProfile | null | undefined, today = new Date()): number | null {
  if (profile?.birthDate) {
    const b = parseLocalDate(profile.birthDate);
    let a = today.getFullYear() - b.getFullYear();
    const m = today.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < b.getDate())) a--;
    return a >= 0 && a < 130 ? a : null;
  }
  if (profile?.birthYear) return today.getFullYear() - profile.birthYear;
  return null;
}

/** IMC = peso (kg) / altura (m)². Apenas o número — a interpretação é da equipe de saúde. */
export function bmi(weightKg: number | undefined, heightCm: number | undefined): number | null {
  if (!weightKg || !heightCm || heightCm < 50) return null;
  const m = heightCm / 100;
  return weightKg / (m * m);
}

export const fmtKg = (n: number) => n.toFixed(1).replace('.', ',');
export const fmtNum1 = (n: number) => n.toFixed(1).replace('.', ',');

/** Variação de peso em relação ao registro mais próximo de N dias atrás. */
export function weightChange(records: WeightRecord[], days: number): { delta: number; fromDate: string } | null {
  if (records.length < 2) return null;
  const sorted = [...records].sort((a, b) => a.at.localeCompare(b.at));
  const last = sorted[sorted.length - 1];
  const target = new Date(last.at).getTime() - days * 86400000;
  const older = sorted.filter((r) => r.id !== last.id && new Date(r.at).getTime() <= target + 3 * 86400000);
  const ref = older.length ? older[older.length - 1] : null;
  if (!ref) return null;
  return { delta: last.weightKg - ref.weightKg, fromDate: ref.at };
}
