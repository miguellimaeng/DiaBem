/* Monta os dados do relatório / preparo de consulta para um período. */
import { repo } from '@/database/repositories';
import { computeStats, CONTEXT_LABEL } from '@/utils/glucose';
import type { BaseRecord, GlucoseContext, GlucoseTargetRange } from '@/types/models';

export async function buildReport(from: Date, to: Date, range: GlucoseTargetRange | null, includeDemo: boolean) {
  const keep = <T extends BaseRecord>(xs: T[]) => (includeDemo ? xs : xs.filter((x) => !x.isDemo));
  const [glucose, meals, insulin, medRecs, meds, acts, moods, events, exams, results, questions, plan] = await Promise.all([
    repo.glucose.between(from, to).then(keep), repo.meals.between(from, to).then(keep), repo.insulin.between(from, to).then(keep),
    repo.medicationRecords.between(from, to).then(keep), repo.medications.all().then(keep), repo.activities.between(from, to).then(keep),
    repo.moods.between(from, to).then(keep), repo.dayEvents.between(from, to).then(keep), repo.exams.all().then(keep),
    repo.examResults.all().then(keep), repo.questions.all().then(keep), repo.insulinPlan.all().then(keep),
  ]);

  const stats = computeStats(glucose, range);
  const byContext = (Object.keys(CONTEXT_LABEL) as GlucoseContext[])
    .map((c) => ({ context: c, ...computeStats(glucose.filter((g) => g.context === c), range) }))
    .filter((c) => c.count > 0);

  const medSummary = meds.filter((m) => m.active).map((m) => {
    const rs = medRecs.filter((r) => r.medicationId === m.id);
    return { med: m, taken: rs.filter((r) => r.status === 'taken').length, postponed: rs.filter((r) => r.status === 'postponed').length, notTaken: rs.filter((r) => r.status === 'not_taken').length };
  });

  const symptomCount = new Map<string, number>();
  moods.forEach((m) => m.symptoms.forEach((s) => symptomCount.set(s, (symptomCount.get(s) ?? 0) + 1)));
  const moodCount = new Map<string, number>();
  moods.forEach((m) => moodCount.set(m.mood, (moodCount.get(m.mood) ?? 0) + 1));

  const latestResults = new Map<string, (typeof results)[number]>();
  [...results].sort((a, b) => b.date.localeCompare(a.date)).forEach((r) => {
    const k = r.indicator === 'other' ? `o:${r.customName}` : r.indicator;
    if (!latestResults.has(k)) latestResults.set(k, r);
  });

  const notes = [
    ...glucose.filter((g) => g.note).map((g) => ({ at: g.at, text: g.note!, kind: 'Glicose' })),
    ...meals.filter((g) => g.note).map((g) => ({ at: g.at, text: g.note!, kind: 'Refeição' })),
    ...insulin.filter((g) => g.note).map((g) => ({ at: g.at, text: g.note!, kind: 'Insulina' })),
    ...acts.filter((g) => g.note).map((g) => ({ at: g.at, text: g.note!, kind: 'Atividade' })),
    ...moods.filter((g) => g.note).map((g) => ({ at: g.at, text: g.note!, kind: 'Como estou' })),
    ...events.map((e) => ({ at: e.at, text: e.title + (e.detail ? ` — ${e.detail}` : ''), kind: 'Evento' })),
  ].sort((a, b) => b.at.localeCompare(a.at));

  const hasDemo = [glucose, meals, insulin, medRecs, acts, moods].some((xs) => xs.some((x) => x.isDemo));

  return {
    from, to, glucose, stats, byContext, meals, insulin, medSummary, acts,
    activityMinutes: acts.reduce((s, a) => s + a.durationMin, 0),
    moods, moodCount, symptoms: [...symptomCount.entries()].sort((a, b) => b[1] - a[1]),
    exams: exams.filter((e) => new Date(e.date) >= new Date(from.getTime() - 180 * 86400000)).sort((a, b) => b.date.localeCompare(a.date)),
    latestResults: [...latestResults.values()],
    notes, questions: questions.filter((q) => !q.done), hasDemo,
    plan: plan.filter((p) => p.active),
  };
}

export type ReportData = Awaited<ReturnType<typeof buildReport>>;
