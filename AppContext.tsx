/* Estado global leve: perfil, configurações, toast e folha de registro rápido. */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { repo, onDataChange } from '@/database/repositories';
import type { AppSettings, ExperienceMode, QuickKind, UserProfile } from '@/types/models';
import { nowISO } from '@/utils/date';

export const DEFAULT_SETTINGS: AppSettings = {
  id: 'settings',
  mode: 'adult',
  fontSize: 'md',
  reduceMotion: false,
  glucoseUnit: 'mg/dL',
  targetRange: null, // sem faixa universal: o usuário/profissional define
  consent: null,
  onboardingDone: false,
  demoLoaded: false,
  remindersEnabled: false,
  updatedAt: nowISO(),
};

export interface QuickState { kind: QuickKind; editId?: string; preset?: Record<string, unknown>; }

interface Ctx {
  ready: boolean;
  settings: AppSettings;
  profile: UserProfile | null;
  updateSettings: (patch: Partial<AppSettings>) => Promise<void>;
  saveProfile: (p: Partial<UserProfile>) => Promise<void>;
  toast: (msg: string) => void;
  quick: QuickState | null;
  openQuick: (kind: QuickKind, opts?: Omit<QuickState, 'kind'>) => void;
  closeQuick: () => void;
  pickerOpen: boolean;
  setPickerOpen: (v: boolean) => void;
  /** Texto adaptado ao perfil: adulto/fácil usam `a`, criança usa `c` se existir. */
  t: (a: string, c?: string) => string;
  mode: ExperienceMode;
}

const AppCtx = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [quick, setQuick] = useState<QuickState | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const load = useCallback(async () => {
    const [s, p] = await Promise.all([repo.settings.get(), repo.profile.get()]);
    setSettings({ ...DEFAULT_SETTINGS, ...(s ?? {}) });
    setProfile(p ?? null);
    setReady(true);
  }, []);

  useEffect(() => { load().catch(() => setReady(true)); }, [load]);
  useEffect(() => onDataChange((s) => { if (s === 'settings' || s === 'profile') load(); }), [load]);

  // Aplica modo, fonte e movimento ao documento
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.mode = settings.mode;
    root.dataset.font = settings.fontSize;
    root.dataset.motion = settings.reduceMotion ? 'reduce' : 'auto';
  }, [settings.mode, settings.fontSize, settings.reduceMotion]);

  useEffect(() => {
    if (!toastMsg) return;
    const t = setTimeout(() => setToastMsg(null), 2600);
    return () => clearTimeout(t);
  }, [toastMsg]);

  const value = useMemo<Ctx>(() => ({
    ready, settings, profile,
    mode: settings.mode,
    async updateSettings(patch) {
      const next = { ...settings, ...patch, updatedAt: nowISO() };
      setSettings(next);
      await repo.settings.set(next);
    },
    async saveProfile(p) {
      const now = nowISO();
      const next: UserProfile = { id: 'me', name: '', diabetesType: 'unspecified', managedBy: 'self', createdAt: now, ...(profile ?? {}), ...p, updatedAt: now };
      setProfile(next);
      await repo.profile.set(next);
    },
    toast: (m) => setToastMsg(m),
    quick,
    openQuick: (kind, opts) => { setPickerOpen(false); setQuick({ kind, ...opts }); },
    closeQuick: () => setQuick(null),
    pickerOpen, setPickerOpen,
    t: (a, c) => (settings.mode === 'child' && c ? c : a),
  }), [ready, settings, profile, quick, pickerOpen]);

  return (
    <AppCtx.Provider value={value}>
      {children}
      {toastMsg && (
        <div className="toast" role="status" aria-live="polite">{toastMsg}</div>
      )}
    </AppCtx.Provider>
  );
}

export function useApp() {
  const c = useContext(AppCtx);
  if (!c) throw new Error('useApp fora do AppProvider');
  return c;
}
