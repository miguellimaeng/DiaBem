/* =========================================================
   Importação de dados para o aparelho.
   Aceita dois formatos:
   1) "diabem-setup" — arquivo de configuração inicial preparado
      por um familiar ou profissional (perfil, esquema de insulina,
      exames transcritos, perguntas, emergência, histórico).
   2) Backup completo gerado em Perfil → Exportar.
   Nada é enviado para fora do aparelho.
   ========================================================= */
import { idb, ALL_STORES, type StoreName } from '@/database/db';
import { repo } from '@/database/repositories';
import { uid } from '@/utils/id';
import { nowISO } from '@/utils/date';
import type {
  AppSettings, Appointment, ConsultationQuestion, EmergencyProfile, ExamResult, HistoryNote, InsulinPlanItem, Medication, UserProfile,
} from '@/types/models';

type Partial2<T> = Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>>;

export interface SetupFile {
  format: 'diabem-setup';
  version: 1;
  createdAt?: string;
  createdBy?: string;
  profile?: Partial<Pick<UserProfile, 'name' | 'diabetesType' | 'birthYear' | 'birthDate' | 'heightCm' | 'managedBy' | 'historyNotes'>>;
  settings?: Partial<Pick<AppSettings, 'mode' | 'fontSize' | 'theme' | 'glucoseUnit' | 'reduceMotion' | 'targetRange'>>;
  insulinPlan?: Partial2<InsulinPlanItem>[];
  medications?: Partial2<Medication>[];
  examResults?: Partial2<ExamResult>[];
  appointments?: Partial2<Appointment>[];
  questions?: Partial2<ConsultationQuestion>[];
  emergency?: Partial<Omit<EmergencyProfile, 'id' | 'updatedAt'>>;
}

export interface ImportSummary { kind: 'setup' | 'backup'; name?: string; counts: Record<string, number>; settings?: SetupFile['settings']; }

const stamp = () => { const n = nowISO(); return { createdAt: n, updatedAt: n, syncStatus: 'local' as const, source: 'import' as const }; };

export async function readImportFile(file: File): Promise<unknown> {
  if (file.size > 300 * 1024 * 1024) throw new Error('Arquivo grande demais.');
  const text = await file.text();
  try { return JSON.parse(text); } catch { throw new Error('O arquivo não é um JSON válido.'); }
}

export function describe(data: unknown): ImportSummary {
  const d = data as Record<string, unknown>;
  if (d?.format === 'diabem-setup') {
    const s = d as unknown as SetupFile;
    return {
      kind: 'setup', name: s.profile?.name, settings: s.settings,
      counts: {
        'Itens do esquema de insulina': s.insulinPlan?.length ?? 0, 'Medicamentos': s.medications?.length ?? 0,
        'Resultados de exames': s.examResults?.length ?? 0, 'Consultas': s.appointments?.length ?? 0,
        'Perguntas para consulta': s.questions?.length ?? 0, 'Notas de histórico': s.profile?.historyNotes?.length ?? 0,
      },
    };
  }
  if (d && typeof d === 'object' && 'data' in d && typeof d.data === 'object') {
    const rows = d.data as Record<string, unknown[]>;
    const counts: Record<string, number> = {};
    for (const k of ALL_STORES) if (Array.isArray(rows[k]) && rows[k].length) counts[k] = rows[k].length;
    const prof = (rows.profile?.[0] ?? {}) as { name?: string };
    return { kind: 'backup', name: prof.name, counts };
  }
  throw new Error('Formato não reconhecido. Use um arquivo de configuração do DiaBem ou um backup exportado pelo app.');
}

/** Aplica o arquivo de configuração. Não apaga dados existentes. */
export async function applySetup(s: SetupFile) {
  const now = nowISO();
  const cur = await repo.profile.get();
  await repo.profile.set({
    id: 'me', name: '', diabetesType: 'unspecified', managedBy: 'self', createdAt: now, ...(cur ?? {}),
    ...s.profile,
    historyNotes: [...(cur?.historyNotes ?? []), ...((s.profile?.historyNotes ?? []).map((n) => ({ ...n, id: n.id || uid('h-') })) as HistoryNote[])],
    updatedAt: now,
  });
  const put = async <T>(store: StoreName, items: unknown[] | undefined) => {
    if (!items?.length) return;
    // createdAt crescente preserva a ordem do arquivo
    const base = Date.now();
    await idb.bulkPut<T>(store, items.map((x, i) => {
      const at = new Date(base + i).toISOString();
      return { ...stamp(), createdAt: at, updatedAt: at, ...(x as object), id: uid() } as T;
    }));
  };
  await put<InsulinPlanItem>('insulinPlan', s.insulinPlan?.map((i) => ({ active: true, confirmed: false, ...i })));
  await put<Medication>('medications', s.medications?.map((m) => ({ active: true, reminder: false, times: [], frequency: 'daily', ...m })));
  await put<ExamResult>('examResults', s.examResults);
  await put<Appointment>('appointments', s.appointments?.map((a) => ({ reminder: true, specialty: 'other', ...a })));
  await put<ConsultationQuestion>('questions', s.questions?.map((q) => ({ done: false, ...q })));
  if (s.emergency) {
    const e = await repo.emergency.get();
    await repo.emergency.set({ id: 'emergency', showName: true, diabetesType: 'unspecified', importantMeds: '', contacts: [], ...(e ?? {}), ...s.emergency, updatedAt: now });
  }
}

function revive(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(revive);
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>;
    if (o.__blob && typeof o.dataUrl === 'string') {
      const [head, b64] = o.dataUrl.split(',');
      const bin = atob(b64); const arr = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      return new Blob([arr], { type: (o.type as string) || head.slice(5).split(';')[0] });
    }
    const out: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(o)) out[k] = revive(x);
    return out;
  }
  return v;
}

/** Restaura um backup completo (mescla por id: o arquivo prevalece). */
export async function applyBackup(data: { data: Record<string, unknown[]> }) {
  for (const store of ALL_STORES) {
    const rows = data.data[store];
    if (Array.isArray(rows) && rows.length) await idb.bulkPut(store, revive(rows) as unknown[]);
  }
}

export async function applyImport(data: unknown) {
  const d = describe(data);
  if (d.kind === 'setup') await applySetup(data as SetupFile);
  else await applyBackup(data as { data: Record<string, unknown[]> });
  return d;
}
