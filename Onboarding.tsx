/* Primeiro acesso — sem conta: nome, perfil, modo de experiência e consentimento. */
import { useEffect, useState } from 'react';
import { useApp } from '@/app/AppContext';
import { Button, Choices, Notice, SelectField, Steps, TextField } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { APP_CONFIG } from '@/config/app.config';
import { DIABETES_TYPE_LABEL } from '@/config/categories';
import { loadDemoData } from '@/database/demoSeed';
import { nowISO } from '@/utils/date';
import type { DiabetesType, ExperienceMode, FontSize } from '@/types/models';
import { ImportSheet } from './ImportSheet';
import type { SetupFile } from '@/services/importData';

const MODES: { value: ExperienceMode; label: string; desc: string }[] = [
  { value: 'adult', label: 'Adulto', desc: 'Equilíbrio entre simplicidade e detalhes.' },
  { value: 'child', label: 'Criança', desc: 'Linguagem simples, missões e conquistas.' },
  { value: 'easy', label: 'Modo Fácil', desc: 'Letras e botões maiores, menos opções na tela.' },
];

export function Onboarding() {
  const { updateSettings, saveProfile } = useApp();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [type, setType] = useState<DiabetesType>('unspecified');
  const [managedBy, setManagedBy] = useState<'self' | 'caregiver'>('self');
  const [mode, setMode] = useState<ExperienceMode>('adult');
  const [c1, setC1] = useState(false);
  const [c2, setC2] = useState(false);
  const [demo, setDemo] = useState(false);
  const [busy, setBusy] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [imported, setImported] = useState<SetupFile['settings'] | null>(null);
  const [fontSize, setFontSize] = useState<FontSize>('md');
  // pré-visualiza o modo escolhido
  useEffect(() => { document.documentElement.dataset.mode = mode; }, [mode]);

  async function finish() {
    setBusy(true);
    await saveProfile({ name: name.trim(), diabetesType: type, managedBy });
    if (demo) await loadDemoData();
    await updateSettings({ ...(imported ?? {}), mode, fontSize, consent: { localStorage: true, medicalDisclaimer: true, acceptedAt: nowISO(), version: 1 }, onboardingDone: true, demoLoaded: demo });
  }

  return (
    <div className="onboarding">
      <Steps total={4} current={step} />
      {step === 0 && (
        <div className="stack" style={{ gap: 18 }}>
          <span className="brand-mark" style={{ width: 64, height: 64, borderRadius: 20 }}><Icon name="drop" size={32} strokeWidth={2.2} /></span>
          <h1 style={{ fontSize: 30 }}>Boas-vindas ao {APP_CONFIG.name}</h1>
          <p className="muted" style={{ fontSize: 'var(--fs-lg)' }}>Um companheiro para organizar a rotina, entender seus registros, aprender sobre diabetes e chegar preparado às consultas.</p>
          <div className="stack-sm">
            {[['calendarDay', 'Registre glicose, refeições, insulina e mais em poucos toques'], ['graduation', 'Aprenda com aulas curtas e missões'], ['clipboard', 'Gere um resumo para levar ao médico'], ['lock', 'Sem cadastro: seus dados ficam neste aparelho']].map(([ic, tx]) => (
              <div key={tx} className="row" style={{ gap: 12 }}><span className="cat tone-blue"><Icon name={ic as 'lock'} /></span><span className="small">{tx}</span></div>
            ))}
          </div>
        </div>
      )}
      {step === 1 && (
        <div className="stack">
          <h1>Sobre você</h1>
          <p className="muted small">Tudo é opcional e pode ser alterado depois.</p>
          <TextField label="Como podemos te chamar?" value={name} onChange={setName} placeholder="Seu nome ou apelido" autoFocus />
          <SelectField label="Tipo de diabetes" value={type} onChange={setType} options={(Object.keys(DIABETES_TYPE_LABEL) as DiabetesType[]).map((k) => ({ value: k, label: DIABETES_TYPE_LABEL[k] }))} />
          <div className="field">
            <span className="field-label">Quem vai usar o app?</span>
            <Choices label="Quem usa" value={managedBy} onChange={setManagedBy} options={[{ value: 'self', label: 'Eu mesmo(a)' }, { value: 'caregiver', label: 'Sou responsável / cuidador' }]} />
          </div>
        </div>
      )}
      {step === 2 && (
        <div className="stack">
          <h1>Como prefere usar?</h1>
          <p className="muted small">Muda o tamanho das letras, a linguagem e quantas opções aparecem. Dá para trocar a qualquer momento no Perfil.</p>
          {MODES.map((m) => (
            <button key={m.value} className="choice" aria-pressed={mode === m.value} onClick={() => setMode(m.value)} style={{ padding: 16 }}>
              <span className={`cat tone-${m.value === 'adult' ? 'blue' : m.value === 'child' ? 'violet' : 'teal'}`}><Icon name={m.value === 'adult' ? 'user' : m.value === 'child' ? 'sparkles' : 'type'} /></span>
              <span><span className="strong" style={{ display: 'block', fontSize: 'var(--fs-md)' }}>{m.label}</span><span className="xsmall muted">{m.desc}</span></span>
            </button>
          ))}
        </div>
      )}
      {step === 3 && (
        <div className="stack">
          <h1>Privacidade e segurança</h1>
          <Notice tone="info" icon="lock">Seus registros de saúde ficam guardados apenas neste aparelho (no navegador). Nada é enviado para servidores. Você pode exportar ou apagar tudo quando quiser.</Notice>
          <label className="choice" style={{ alignItems: 'flex-start', cursor: 'pointer' }}>
            <input type="checkbox" checked={c1} onChange={(e) => setC1(e.target.checked)} style={{ width: 22, height: 22, marginTop: 1 }} />
            <span className="small">Concordo em guardar meus dados de saúde neste aparelho para usar o app.</span>
          </label>
          <label className="choice" style={{ alignItems: 'flex-start', cursor: 'pointer' }}>
            <input type="checkbox" checked={c2} onChange={(e) => setC2(e.target.checked)} style={{ width: 22, height: 22, marginTop: 1 }} />
            <span className="small">Entendo que o {APP_CONFIG.name} não faz diagnóstico, não prescreve, não calcula doses de insulina e não substitui minha equipe de saúde.</span>
          </label>
          <label className="choice" style={{ alignItems: 'flex-start', cursor: 'pointer' }}>
            <input type="checkbox" checked={demo} onChange={(e) => setDemo(e.target.checked)} style={{ width: 22, height: 22, marginTop: 1 }} />
            <span className="small">Quero explorar com <b>dados de demonstração</b> (marcados como “Demo” e removíveis a qualquer momento).</span>
          </label>
        </div>
      )}
      {importOpen && (
        <ImportSheet onClose={() => setImportOpen(false)} onDone={(sum, raw) => {
          const s = raw as SetupFile;
          if (sum.kind === 'setup') {
            if (s.profile?.name) setName(s.profile.name);
            if (s.profile?.diabetesType) setType(s.profile.diabetesType);
            if (s.profile?.managedBy) setManagedBy(s.profile.managedBy);
            if (s.settings?.mode) setMode(s.settings.mode);
            if (s.settings?.fontSize) setFontSize(s.settings.fontSize);
            setImported(s.settings ?? {});
          } else {
            setImported({});
          }
          setImportOpen(false);
          setStep(1);
        }} />
      )}
      {imported && step > 0 && step < 3 && <Notice tone="info" icon="checkCircle">Arquivo importado. Confira os dados e continue.</Notice>}
      <div className="foot">
        {step === 0 && !imported && <Button block variant="ghost" icon="upload" onClick={() => setImportOpen(true)}>Tenho um arquivo de configuração</Button>}
        {step < 3 ? (
          <Button block onClick={() => setStep(step + 1)}>{step === 0 ? 'Começar' : 'Continuar'}</Button>
        ) : (
          <Button block icon="check" disabled={!c1 || !c2 || busy} onClick={finish}>{busy ? 'Preparando…' : 'Entrar no app'}</Button>
        )}
        {step > 0 && <Button block variant="ghost" onClick={() => setStep(step - 1)}>Voltar</Button>}
      </div>
    </div>
  );
}
