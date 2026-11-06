/* =========================================================
   Dados de demonstração — SEMPRE marcados com isDemo: true.
   Valores ilustrativos, gerados de forma determinística.
   Não representam nenhuma pessoa e não são referência
   clínica. Podem ser removidos em Perfil > Dados.
   ========================================================= */
import { repo } from './repositories';
import { uid } from '@/utils/id';
import { addDays, nowISO, startOfDay, toLocalDateInput } from '@/utils/date';
import type {
  ActivityRecord, Appointment, ConsultationQuestion, DayEvent, Exam, ExamResult, GlucoseContext, GlucoseRecord,
  InsulinRecord, MealRecord, Medication, MedicationRecord, MoodRecord,
} from '@/types/models';

function rng(seed: number) {
  return () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
}

const base = () => {
  const now = nowISO();
  return { createdAt: now, updatedAt: now, syncStatus: 'local' as const, isDemo: true, source: 'demo' as const };
};

function at(day: Date, h: number, m: number) {
  const d = new Date(day); d.setHours(h, m, 0, 0); return d.toISOString();
}

export async function loadDemoData() {
  const r = rng(42);
  const today = startOfDay();
  const nowMs = Date.now();
  const glucose: GlucoseRecord[] = [];
  const meals: MealRecord[] = [];
  const insulin: InsulinRecord[] = [];
  const acts: ActivityRecord[] = [];
  const moods: MoodRecord[] = [];
  const events: DayEvent[] = [];
  const medRecs: MedicationRecord[] = [];

  const med: Medication = { ...base(), id: 'demo-med-1', name: 'Medicamento de exemplo', dose: '1 comprimido', times: ['08:00', '20:00'], frequency: 'twice_daily', active: true, important: true, reminder: false, note: 'Item de demonstração' };

  const breakfasts = ['Pão integral com ovo mexido e café', 'Iogurte natural com frutas', 'Tapioca com queijo branco', 'Mingau de aveia com canela'];
  const lunches = ['Arroz, feijão, frango grelhado e salada', 'Peixe assado com legumes e arroz', 'Macarrão com carne moída e salada', 'Omelete com legumes e salada'];
  const dinners = ['Sopa de legumes com frango', 'Wrap de frango desfiado', 'Salada completa com frango', 'Arroz, ovo e legumes refogados'];

  const slots: { h: number; m: number; ctx: GlucoseContext; base: number }[] = [
    { h: 7, m: 40, ctx: 'fasting', base: 108 },
    { h: 10, m: 15, ctx: 'after_meal', base: 150 },
    { h: 15, m: 0, ctx: 'after_meal', base: 140 },
    { h: 22, m: 10, ctx: 'bedtime', base: 125 },
  ];

  for (let i = 44; i >= 0; i--) {
    const day = addDays(today, -i);
    // alguns dias sem registro — a vida real é assim, e tudo bem
    if (i > 0 && r() < 0.12) continue;
    for (const s of slots) {
      if (r() < 0.18) continue;
      const iso = at(day, s.h, s.m + Math.floor(r() * 25));
      if (new Date(iso).getTime() > nowMs) continue;
      const v = Math.round(s.base + (r() - 0.5) * 70 + Math.sin(i / 5) * 10);
      glucose.push({ ...base(), id: uid('demo-g-'), at: iso, valueMgdl: v, enteredUnit: 'mg/dL', enteredValue: v, context: s.ctx });
    }
    const mealSlots: [MealRecord['mealType'], number, number, string[]][] = [
      ['breakfast', 8, 10, breakfasts], ['lunch', 12, 30, lunches], ['dinner', 19, 40, dinners],
    ];
    for (const [type, h, m, opts] of mealSlots) {
      if (r() < 0.25) continue;
      const iso = at(day, h, m + Math.floor(r() * 20));
      if (new Date(iso).getTime() > nowMs) continue;
      meals.push({ ...base(), id: uid('demo-m-'), at: iso, mealType: type, description: opts[Math.floor(r() * opts.length)], carbsGrams: null });
    }
    const bIso = at(day, 8, 5);
    if (new Date(bIso).getTime() < nowMs && r() > 0.2) insulin.push({ ...base(), id: uid('demo-i-'), at: bIso, kind: 'basal', name: 'Insulina de exemplo', dose: 10, unit: 'U', note: 'Valor ilustrativo' });
    for (const t of med.times) {
      const [h, m] = t.split(':').map(Number);
      const iso = at(day, h, m + 5);
      if (new Date(iso).getTime() > nowMs || r() < 0.15) continue;
      medRecs.push({ ...base(), id: uid('demo-mr-'), at: iso, medicationId: med.id, medicationName: med.name, status: r() < 0.9 ? 'taken' : 'postponed', scheduledTime: t });
    }
    if (r() < 0.55) {
      const iso = at(day, i === 0 ? 7 : 17, i === 0 ? 0 : 30);
      if (new Date(iso).getTime() < nowMs) acts.push({ ...base(), id: uid('demo-a-'), at: iso, activityType: ['Caminhada', 'Bicicleta', 'Alongamento'][Math.floor(r() * 3)], durationMin: [20, 30, 40][Math.floor(r() * 3)], intensity: r() < 0.7 ? 'light' : 'moderate' });
    }
    if (r() < 0.4) {
      const iso = at(day, 21, 0);
      if (new Date(iso).getTime() < nowMs) moods.push({ ...base(), id: uid('demo-mo-'), at: iso, mood: (['great', 'good', 'ok', 'tired'] as const)[Math.floor(r() * 4)], symptoms: r() < 0.2 ? ['Cansaço'] : [] });
    }
    const sIso = at(day, 6, 50);
    if (new Date(sIso).getTime() < nowMs) events.push({ ...base(), id: uid('demo-e-'), at: sIso, kind: 'sleep', title: 'Acordei', detail: r() < 0.7 ? 'Dormi bem' : 'Noite agitada' });
  }

  const appt: Appointment = { ...base(), id: 'demo-ap-1', at: at(addDays(today, 12), 14, 30), doctor: 'Dra. Exemplo', specialty: 'endocrinologist', location: 'Clínica de demonstração', reminder: true };
  const appt2: Appointment = { ...base(), id: 'demo-ap-2', at: at(addDays(today, 34), 9, 0), specialty: 'nutritionist', reminder: true, location: 'Consultório de demonstração' };

  const exams: Exam[] = [
    { ...base(), id: 'demo-ex-1', name: 'Hemograma e bioquímica', date: toLocalDateInput(addDays(today, -20)), lab: 'Laboratório de exemplo', attachments: [], note: 'Exame de demonstração (sem arquivo)' },
  ];
  const results: ExamResult[] = [
    [-260, 7.6], [-170, 7.3], [-80, 7.1], [-20, 6.9],
  ].map(([d, v]) => ({ ...base(), id: uid('demo-er-'), indicator: 'hba1c' as const, value: v, unit: '%', date: toLocalDateInput(addDays(today, d)) }));
  results.push(
    { ...base(), id: uid('demo-er-'), indicator: 'ldl', value: 112, unit: 'mg/dL', date: toLocalDateInput(addDays(today, -170)) },
    { ...base(), id: uid('demo-er-'), indicator: 'ldl', value: 104, unit: 'mg/dL', date: toLocalDateInput(addDays(today, -20)) },
  );

  const questions: ConsultationQuestion[] = [
    { ...base(), id: 'demo-q-1', text: 'Tenho sentido muita fome à noite.', done: false },
    { ...base(), id: 'demo-q-2', text: 'Minha glicose sobe depois do café da manhã.', done: false },
  ];

  await Promise.all([
    repo.glucose.bulkAdd(glucose), repo.meals.bulkAdd(meals), repo.insulin.bulkAdd(insulin),
    repo.activities.bulkAdd(acts), repo.moods.bulkAdd(moods), repo.dayEvents.bulkAdd(events),
    repo.medications.bulkAdd([med]), repo.medicationRecords.bulkAdd(medRecs),
    repo.appointments.bulkAdd([appt, appt2]), repo.exams.bulkAdd(exams), repo.examResults.bulkAdd(results),
    repo.questions.bulkAdd(questions),
  ]);
}
