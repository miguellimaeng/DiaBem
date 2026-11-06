import type { GlucoseContext, GlucoseRecord, GlucoseTargetRange, GlucoseUnit } from '@/types/models';

/** Fator de conversão padrão: 1 mmol/L de glicose ≈ 18,0182 mg/dL. */
export const MGDL_PER_MMOL = 18.0182;

export const toMgdl = (v: number, unit: GlucoseUnit) => (unit === 'mg/dL' ? v : v * MGDL_PER_MMOL);
export const fromMgdl = (mgdl: number, unit: GlucoseUnit) => (unit === 'mg/dL' ? mgdl : mgdl / MGDL_PER_MMOL);

export function formatGlucose(mgdl: number, unit: GlucoseUnit): string {
  const v = fromMgdl(mgdl, unit);
  return unit === 'mg/dL' ? String(Math.round(v)) : v.toFixed(1).replace('.', ',');
}

/** Limites de digitação (evitam erros de digitação, não são faixas clínicas). */
export const INPUT_LIMITS: Record<GlucoseUnit, { min: number; max: number; step: number }> = {
  'mg/dL': { min: 10, max: 700, step: 1 },
  'mmol/L': { min: 0.6, max: 38.9, step: 0.1 },
};

export const CONTEXT_LABEL: Record<GlucoseContext, string> = {
  fasting: 'Jejum',
  before_meal: 'Antes da refeição',
  after_meal: 'Depois da refeição',
  bedtime: 'Antes de dormir',
  exercise: 'Exercício',
  other: 'Outro',
};

export type RangeState = 'in' | 'below' | 'above' | 'unset';

export function rangeState(mgdl: number, range: GlucoseTargetRange | null): RangeState {
  if (!range) return 'unset';
  if (mgdl < range.lowMgdl) return 'below';
  if (mgdl > range.highMgdl) return 'above';
  return 'in';
}

/** Linguagem neutra, sem julgamento e sem diagnóstico. */
export const RANGE_LABEL: Record<RangeState, string> = {
  in: 'Dentro da faixa',
  below: 'Abaixo da faixa',
  above: 'Acima da faixa',
  unset: 'Faixa não definida',
};

export interface GlucoseStats {
  count: number;
  avg: number | null;
  min: number | null;
  max: number | null;
  /** Percentuais (0–100). Só quando há faixa configurada. */
  inRange: number | null;
  below: number | null;
  above: number | null;
  trend: 'up' | 'down' | 'flat' | 'unknown';
  daysWithRecords: number;
}

export function computeStats(records: GlucoseRecord[], range: GlucoseTargetRange | null): GlucoseStats {
  const vals = records.map((r) => r.valueMgdl);
  const count = vals.length;
  const days = new Set(records.map((r) => new Date(r.at).toDateString())).size;
  if (!count) return { count: 0, avg: null, min: null, max: null, inRange: null, below: null, above: null, trend: 'unknown', daysWithRecords: 0 };
  const sum = vals.reduce((a, b) => a + b, 0);
  let inR = 0, lo = 0, hi = 0;
  if (range) for (const v of vals) { if (v < range.lowMgdl) lo++; else if (v > range.highMgdl) hi++; else inR++; }
  return {
    count,
    avg: sum / count,
    min: Math.min(...vals),
    max: Math.max(...vals),
    inRange: range ? (inR / count) * 100 : null,
    below: range ? (lo / count) * 100 : null,
    above: range ? (hi / count) * 100 : null,
    trend: trendOf(records),
    daysWithRecords: days,
  };
}

/** Tendência descritiva: compara a média da metade mais recente com a anterior. */
export function trendOf(records: GlucoseRecord[]): GlucoseStats['trend'] {
  if (records.length < 4) return 'unknown';
  const sorted = [...records].sort((a, b) => a.at.localeCompare(b.at));
  const half = Math.floor(sorted.length / 2);
  const avg = (xs: GlucoseRecord[]) => xs.reduce((s, r) => s + r.valueMgdl, 0) / xs.length;
  const delta = avg(sorted.slice(half)) - avg(sorted.slice(0, half));
  if (Math.abs(delta) < 8) return 'flat';
  return delta > 0 ? 'up' : 'down';
}

export const TREND_LABEL: Record<GlucoseStats['trend'], string> = {
  up: 'Subindo',
  down: 'Descendo',
  flat: 'Estável',
  unknown: 'Poucos dados',
};
