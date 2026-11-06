/* =========================================================
   Repositórios — a única porta de entrada para os dados.
   As telas nunca falam com o IndexedDB diretamente; assim,
   trocar/estender por Supabase é uma mudança localizada.
   ========================================================= */
import { idb, type EntityStore, type StoreName, type TimedStore, ALL_STORES } from './db';
import { uid } from '@/utils/id';
import { nowISO } from '@/utils/date';
import type {
  ActivityRecord, AppSettings, Appointment, AchievementUnlock, BaseRecord, CaregiverPermission,
  ConsultationQuestion, DayEvent, EmergencyProfile, Exam, ExamResult, GlucoseRecord, InsulinPlanItem, InsulinRecord,
  LearningProgress, MealRecord, Medication, MedicationRecord, MoodRecord, RecipeFavorite, TimedRecord, UserProfile, WeightRecord,
} from '@/types/models';

/* ---------- Notificação de mudanças (para telas reativas) ---------- */
type Listener = (store: StoreName) => void;
const listeners = new Set<Listener>();
export function onDataChange(fn: Listener) { listeners.add(fn); return () => { listeners.delete(fn); }; }
function emit(store: StoreName) { listeners.forEach((l) => l(store)); }

/** Campos que o repositório preenche sozinho. */
export type NewRecord<T extends BaseRecord> = Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'> & Partial<Pick<T, 'id'>>;

function stamp<T extends BaseRecord>(input: NewRecord<T>): T {
  const now = nowISO();
  return {
    source: 'manual',
    ...input,
    id: input.id ?? uid(),
    createdAt: now,
    updatedAt: now,
    // 'local' = ainda não existe backend. Com sync ativo passa a 'pending'.
    syncStatus: 'local',
  } as unknown as T;
}

const alive = <T extends BaseRecord>(xs: T[]) => xs.filter((x) => !x.deletedAt);

function entityRepo<T extends BaseRecord>(store: EntityStore | TimedStore) {
  return {
    store,
    async all(): Promise<T[]> { return alive(await idb.getAll<T>(store)); },
    async get(id: string) { const r = await idb.get<T>(store, id); return r && !r.deletedAt ? r : undefined; },
    async add(input: NewRecord<T>): Promise<T> {
      const rec = stamp<T>(input);
      await idb.put(store, rec); emit(store); return rec;
    },
    async update(id: string, patch: Partial<T>): Promise<T | undefined> {
      const cur = await idb.get<T>(store, id);
      if (!cur) return undefined;
      const next = { ...cur, ...patch, id, updatedAt: nowISO(), syncStatus: cur.syncStatus === 'synced' ? 'pending' : cur.syncStatus } as T;
      await idb.put(store, next); emit(store); return next;
    },
    /** Soft delete — mantém marcador para sincronização futura. */
    async remove(id: string) {
      const cur = await idb.get<T>(store, id);
      if (!cur) return;
      if (cur.syncStatus === 'local') await idb.delete(store, id);
      else await idb.put(store, { ...cur, deletedAt: nowISO(), syncStatus: 'pending' });
      emit(store);
    },
    async bulkAdd(items: T[]) { await idb.bulkPut(store, items); emit(store); },
  };
}

function timedRepo<T extends TimedRecord>(store: TimedStore) {
  const base = entityRepo<T>(store);
  return {
    ...base,
    async between(from: Date, to: Date): Promise<T[]> {
      const xs = alive(await idb.getRange<T>(store, from.toISOString(), to.toISOString()));
      return xs.sort((a, b) => a.at.localeCompare(b.at));
    },
    async latest(n = 1): Promise<T[]> {
      const xs = await base.all();
      return xs.sort((a, b) => b.at.localeCompare(a.at)).slice(0, n);
    },
  };
}

function singletonRepo<T extends { id: string }>(store: 'profile' | 'settings' | 'emergency', key: T['id']) {
  return {
    get: () => idb.get<T>(store, key),
    async set(value: T) { await idb.put(store, value); emit(store); return value; },
  };
}

function kvRepo<T extends { id: string }>(store: 'favorites' | 'learningProgress' | 'achievements') {
  return {
    all: () => idb.getAll<T>(store),
    get: (id: string) => idb.get<T>(store, id),
    async put(v: T) { await idb.put(store, v); emit(store); },
    async remove(id: string) { await idb.delete(store, id); emit(store); },
  };
}

export const repo = {
  glucose: timedRepo<GlucoseRecord>('glucose'),
  meals: timedRepo<MealRecord>('meals'),
  insulin: timedRepo<InsulinRecord>('insulin'),
  medicationRecords: timedRepo<MedicationRecord>('medicationRecords'),
  activities: timedRepo<ActivityRecord>('activities'),
  moods: timedRepo<MoodRecord>('moods'),
  dayEvents: timedRepo<DayEvent>('dayEvents'),
  weights: timedRepo<WeightRecord>('weights'),

  medications: entityRepo<Medication>('medications'),
  exams: entityRepo<Exam>('exams'),
  examResults: entityRepo<ExamResult>('examResults'),
  appointments: entityRepo<Appointment>('appointments'),
  questions: entityRepo<ConsultationQuestion>('questions'),
  caregivers: entityRepo<CaregiverPermission>('caregivers'),
  insulinPlan: entityRepo<InsulinPlanItem>('insulinPlan'),

  profile: singletonRepo<UserProfile>('profile', 'me'),
  settings: singletonRepo<AppSettings>('settings', 'settings'),
  emergency: singletonRepo<EmergencyProfile>('emergency', 'emergency'),

  favorites: kvRepo<RecipeFavorite>('favorites'),
  learningProgress: kvRepo<LearningProgress>('learningProgress'),
  achievements: kvRepo<AchievementUnlock>('achievements'),
};

export const TIMED_REPOS = {
  glucose: repo.glucose, meals: repo.meals, insulin: repo.insulin, medicationRecords: repo.medicationRecords,
  activities: repo.activities, moods: repo.moods, dayEvents: repo.dayEvents, weights: repo.weights,
};

/** Remove somente os dados de demonstração, preservando os reais. */
export async function clearDemoData() {
  for (const store of ALL_STORES) {
    if (store === 'profile' || store === 'settings') continue;
    const rows = await idb.getAll<{ id: string; isDemo?: boolean }>(store);
    const demo = rows.filter((r) => r.isDemo);
    for (const r of demo) await idb.delete(store, r.id);
    if (demo.length) emit(store);
  }
}

/** Exclusão total (direito de exclusão — LGPD). */
export async function deleteAllData() {
  await idb.destroy();
  ALL_STORES.forEach(emit);
}
