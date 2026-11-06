/* Junta todos os registros de um período em uma linha do tempo única. */
import { repo } from '@/database/repositories';
import type { IconName } from '@/components/Icon';
import type { GlucoseUnit, QuickKind, Tone } from '@/types/models';
import { DAY_EVENT_META, INSULIN_KIND_LABEL, INTENSITY_LABEL, KIND_META, MEAL_LABEL, MED_STATUS_META, MOOD_META } from '@/config/categories';
import { CONTEXT_LABEL, formatGlucose } from '@/utils/glucose';

export interface TimelineItem {
  id: string;
  kind: QuickKind;
  at: string;
  title: string;
  sub: string;
  icon: IconName;
  tone: Tone;
  isDemo?: boolean;
}

export async function loadTimeline(from: Date, to: Date, unit: GlucoseUnit): Promise<TimelineItem[]> {
  const [g, m, i, mr, a, mo, ev, w] = await Promise.all([
    repo.glucose.between(from, to), repo.meals.between(from, to), repo.insulin.between(from, to),
    repo.medicationRecords.between(from, to), repo.activities.between(from, to), repo.moods.between(from, to),
    repo.dayEvents.between(from, to), repo.weights.between(from, to),
  ]);
  const items: TimelineItem[] = [
    ...g.map((r) => ({ id: r.id, kind: 'glucose' as const, at: r.at, title: 'Glicose', sub: `${formatGlucose(r.valueMgdl, unit)} ${unit} · ${CONTEXT_LABEL[r.context]}`, icon: KIND_META.glucose.icon, tone: KIND_META.glucose.tone, isDemo: r.isDemo })),
    ...m.map((r) => ({ id: r.id, kind: 'meal' as const, at: r.at, title: MEAL_LABEL[r.mealType], sub: r.description + (r.carbsGrams != null ? ` · ${r.carbsGrams} g carb.` : ''), icon: KIND_META.meal.icon, tone: KIND_META.meal.tone, isDemo: r.isDemo })),
    ...i.map((r) => ({ id: r.id, kind: 'insulin' as const, at: r.at, title: `Insulina ${INSULIN_KIND_LABEL[r.kind].toLowerCase()}`, sub: `${String(r.dose).replace('.', ',')} ${r.unit}${r.name ? ' · ' + r.name : ''}`, icon: KIND_META.insulin.icon, tone: KIND_META.insulin.tone, isDemo: r.isDemo })),
    ...mr.map((r) => ({ id: r.id, kind: 'medication' as const, at: r.at, title: r.medicationName, sub: MED_STATUS_META[r.status].label, icon: KIND_META.medication.icon, tone: KIND_META.medication.tone, isDemo: r.isDemo })),
    ...a.map((r) => ({ id: r.id, kind: 'activity' as const, at: r.at, title: r.activityType, sub: `${r.durationMin} min · ${INTENSITY_LABEL[r.intensity].toLowerCase()}`, icon: KIND_META.activity.icon, tone: KIND_META.activity.tone, isDemo: r.isDemo })),
    ...mo.map((r) => ({ id: r.id, kind: 'mood' as const, at: r.at, title: MOOD_META[r.mood].label, sub: r.symptoms.length ? r.symptoms.join(', ') : 'Como estou', icon: KIND_META.mood.icon, tone: KIND_META.mood.tone, isDemo: r.isDemo })),
    ...w.map((r) => ({ id: r.id, kind: 'weight' as const, at: r.at, title: 'Peso', sub: `${String(r.weightKg).replace('.', ',')} kg${r.note ? ' · ' + r.note : ''}`, icon: KIND_META.weight.icon, tone: KIND_META.weight.tone, isDemo: r.isDemo })),
    ...ev.map((r) => ({ id: r.id, kind: 'event' as const, at: r.at, title: r.title, sub: r.detail ?? DAY_EVENT_META[r.kind].label, icon: DAY_EVENT_META[r.kind].icon, tone: DAY_EVENT_META[r.kind].tone, isDemo: r.isDemo })),
  ];
  return items.sort((x, y) => x.at.localeCompare(y.at));
}

/** "Rotina registrada" = quantos tipos-chave de registro o dia já tem. Incentivo, não nota. */
export const ROUTINE_KINDS: { kind: QuickKind; label: string }[] = [
  { kind: 'glucose', label: 'Glicose' },
  { kind: 'meal', label: 'Refeição' },
  { kind: 'medication', label: 'Medicamento ou insulina' },
  { kind: 'activity', label: 'Movimento' },
  { kind: 'mood', label: 'Como estou' },
];

export function routineProgress(items: TimelineItem[]) {
  const has = (k: QuickKind) => items.some((i) => i.kind === k || (k === 'medication' && i.kind === 'insulin'));
  const done = ROUTINE_KINDS.filter((r) => has(r.kind));
  return { done: done.length, total: ROUTINE_KINDS.length, pct: (done.length / ROUTINE_KINDS.length) * 100, missing: ROUTINE_KINDS.filter((r) => !has(r.kind)) };
}
