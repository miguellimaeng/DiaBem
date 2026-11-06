/* =========================================================
   Conquistas — apenas por AÇÕES positivas (registrar,
   aprender, se organizar). Nunca por valores de glicose.
   ========================================================= */
import { repo } from '@/database/repositories';
import type { IconName } from '@/components/Icon';
import type { Tone } from '@/types/models';
import { addDays, startOfDay } from '@/utils/date';
import { nowISO } from '@/utils/date';

export interface AchievementDef { id: string; title: string; titleChild?: string; desc: string; icon: IconName; tone: Tone; }

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first-record', title: 'Primeiro registro', desc: 'Você fez seu primeiro registro.', icon: 'sparkles', tone: 'blue' },
  { id: 'streak-3', title: '3 dias seguidos', desc: 'Registrou sua rotina por 3 dias seguidos.', icon: 'flame', tone: 'amber' },
  { id: 'streak-7', title: '7 dias de rotina', desc: 'Você registrou sua rotina por 7 dias.', icon: 'trophy', tone: 'amber' },
  { id: 'lesson-1', title: 'Primeira aula', desc: 'Concluiu sua primeira aula.', icon: 'bookOpen', tone: 'violet' },
  { id: 'lesson-5', title: '5 aulas', desc: 'Você completou 5 aulas.', icon: 'graduation', tone: 'violet' },
  { id: 'activity', title: 'Em movimento', titleChild: 'Super ativo', desc: 'Você registrou atividade física.', icon: 'footprints', tone: 'teal' },
  { id: 'meal-5', title: 'Diário do prato', desc: 'Registrou 5 refeições.', icon: 'utensils', tone: 'amber' },
  { id: 'report', title: 'Pronto para a consulta', desc: 'Você preparou seu resumo para consulta.', icon: 'clipboard', tone: 'green' },
  { id: 'emergency', title: 'Precavido', desc: 'Preencheu sua tela de emergência.', icon: 'shield', tone: 'rose' },
  { id: 'exam', title: 'Exames organizados', desc: 'Guardou seu primeiro exame.', icon: 'flask', tone: 'teal' },
];

export interface AchievementStatus { def: AchievementDef; unlockedAt?: string; }

/** Dias consecutivos (até hoje ou ontem) com pelo menos um registro. */
export async function currentStreak(): Promise<number> {
  const from = addDays(startOfDay(), -60);
  const to = new Date();
  const lists = await Promise.all([
    repo.glucose.between(from, to), repo.meals.between(from, to), repo.insulin.between(from, to),
    repo.medicationRecords.between(from, to), repo.activities.between(from, to), repo.moods.between(from, to),
  ]);
  const days = new Set(lists.flat().map((r) => new Date(r.at).toDateString()));
  let d = startOfDay();
  if (!days.has(d.toDateString())) d = addDays(d, -1); // ainda dá tempo de registrar hoje
  let n = 0;
  while (days.has(d.toDateString())) { n++; d = addDays(d, -1); }
  return n;
}

export async function evaluateAchievements(): Promise<AchievementStatus[]> {
  const [unlocked, progress, glucose, meals, acts, emergency, exams, streak] = await Promise.all([
    repo.achievements.all(), repo.learningProgress.all(), repo.glucose.all(), repo.meals.all(), repo.activities.all(),
    repo.emergency.get(), repo.exams.all(), currentStreak(),
  ]);
  const map = new Map(unlocked.map((u) => [u.id, u.unlockedAt]));
  const lessonsDone = progress.filter((p) => p.completedAt).length;
  const anyRecord = glucose.length + meals.length + acts.length > 0;
  const earned: Record<string, boolean> = {
    'first-record': anyRecord,
    'streak-3': streak >= 3,
    'streak-7': streak >= 7,
    'lesson-1': lessonsDone >= 1,
    'lesson-5': lessonsDone >= 5,
    activity: acts.length > 0,
    'meal-5': meals.length >= 5,
    report: map.has('report'),
    emergency: !!emergency && (emergency.contacts.length > 0 || !!emergency.importantMeds),
    exam: exams.length > 0,
  };
  for (const a of ACHIEVEMENTS) {
    if (earned[a.id] && !map.has(a.id)) {
      const at = nowISO();
      map.set(a.id, at);
      await repo.achievements.put({ id: a.id, unlockedAt: at });
    }
  }
  return ACHIEVEMENTS.map((def) => ({ def, unlockedAt: map.get(def.id) }));
}

export async function unlock(id: string) {
  if (!(await repo.achievements.get(id))) await repo.achievements.put({ id, unlockedAt: nowISO() });
}
