import { useEffect, useId, useState } from 'react';
import { useApp } from '@/app/AppContext';
import { repo } from '@/database/repositories';
import { Choices, DateTimeFields, Field, Notice, Segmented, TextField } from '@/components/ui';
import { RecordSheet, useWhen } from '@/components/ui/RecordSheet';
import type { GlucoseContext, GlucoseUnit } from '@/types/models';
import { CONTEXT_LABEL, INPUT_LIMITS, fromMgdl, toMgdl, rangeState, RANGE_LABEL } from '@/utils/glucose';

export interface FormProps { editId?: string; preset?: Record<string, unknown>; onDone: () => void; }

const CONTEXTS = Object.entries(CONTEXT_LABEL).map(([value, label]) => ({ value: value as GlucoseContext, label }));

export function GlucoseForm({ editId, onDone }: FormProps) {
  const { settings, toast, t } = useApp();
  const [unit, setUnit] = useState<GlucoseUnit>(settings.glucoseUnit);
  const [value, setValue] = useState('');
  const [context, setContext] = useState<GlucoseContext>(guessContext());
  const [note, setNote] = useState('');
  const when = useWhen();
  const id = useId();

  useEffect(() => {
    if (!editId) return;
    repo.glucose.get(editId).then((r) => {
      if (!r) return;
      setUnit(r.enteredUnit); setValue(String(r.enteredValue).replace('.', ',')); setContext(r.context); setNote(r.note ?? ''); when.reset(r.at);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

  const num = Number(value.replace(',', '.'));
  const lim = INPUT_LIMITS[unit];
  const valid = value !== '' && Number.isFinite(num) && num >= lim.min && num <= lim.max;
  const mgdl = valid ? toMgdl(num, unit) : null;
  const state = mgdl != null ? rangeState(mgdl, settings.targetRange) : null;

  function switchUnit(u: GlucoseUnit) {
    if (u === unit) return;
    if (valid) {
      const conv = fromMgdl(toMgdl(num, unit), u);
      setValue(u === 'mg/dL' ? String(Math.round(conv)) : conv.toFixed(1).replace('.', ','));
    }
    setUnit(u);
  }

  async function save() {
    if (!valid || mgdl == null) return;
    const data = { valueMgdl: Math.round(mgdl * 10) / 10, enteredUnit: unit, enteredValue: num, context, note: note.trim() || undefined, at: when.iso() };
    if (editId) await repo.glucose.update(editId, data);
    else await repo.glucose.add(data);
    toast(t('Glicose registrada', 'Muito bem! Glicose anotada'));
    onDone();
  }

  return (
    <RecordSheet title={editId ? 'Editar glicose' : t('Registrar glicose', 'Anotar glicose')} onClose={onDone} onSave={save} canSave={valid}
      onDelete={editId ? async () => { await repo.glucose.remove(editId); toast('Registro excluído'); onDone(); } : undefined}>
      <Field label="Valor" htmlFor={id} hint={`Digite entre ${String(lim.min).replace('.', ',')} e ${String(lim.max).replace('.', ',')} ${unit}.`}>
        <input id={id} className="input input-big" inputMode="decimal" placeholder={unit === 'mg/dL' ? '000' : '0,0'} value={value}
          onChange={(e) => setValue(e.target.value.replace(/[^0-9.,]/g, ''))} aria-describedby={`${id}-state`} />
      </Field>
      <Segmented label="Unidade" value={unit} onChange={switchUnit} options={[{ value: 'mg/dL', label: 'mg/dL' }, { value: 'mmol/L', label: 'mmol/L' }]} />
      {state && state !== 'unset' && (
        <p id={`${id}-state`} className="small muted center">{RANGE_LABEL[state]} configurada.</p>
      )}
      <Field label={t('Momento', 'Quando foi?')}>
        <Choices label="Contexto" options={CONTEXTS} value={context} onChange={setContext} />
      </Field>
      <DateTimeFields date={when.date} time={when.time} onDate={when.setDate} onTime={when.setTime} />
      <TextField label="Observação (opcional)" value={note} onChange={setNote} placeholder="Ex.: medi depois de subir escadas" multiline />
      {settings.mode !== 'child' && (
        <Notice tone="neutral">Este é um registro pessoal. Se o valor for inesperado ou você não estiver bem, siga o plano combinado com sua equipe de saúde.</Notice>
      )}
    </RecordSheet>
  );
}

function guessContext(): GlucoseContext {
  const h = new Date().getHours();
  if (h >= 5 && h < 9) return 'fasting';
  if (h >= 22 || h < 2) return 'bedtime';
  return 'other';
}
