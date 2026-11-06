import { useEffect, useState } from 'react';
import { useApp } from '@/app/AppContext';
import { repo } from '@/database/repositories';
import { Choices, DateTimeFields, Field, Pills, Segmented, TextField } from '@/components/ui';
import { RecordSheet, useWhen } from '@/components/ui/RecordSheet';
import { ACTIVITY_TYPES, INTENSITY_LABEL } from '@/config/categories';
import type { Intensity } from '@/types/models';
import type { FormProps } from '../glucose/GlucoseForm';

const DURATIONS = ['10', '20', '30', '45', '60'];

export function ActivityForm({ editId, onDone }: FormProps) {
  const { toast, t } = useApp();
  const [type, setType] = useState('Caminhada');
  const [custom, setCustom] = useState('');
  const [duration, setDuration] = useState('20');
  const [intensity, setIntensity] = useState<Intensity>('light');
  const [note, setNote] = useState('');
  const when = useWhen();

  useEffect(() => {
    if (!editId) return;
    repo.activities.get(editId).then((r) => {
      if (!r) return;
      if (ACTIVITY_TYPES.includes(r.activityType)) setType(r.activityType); else { setType('Outro'); setCustom(r.activityType); }
      setDuration(String(r.durationMin)); setIntensity(r.intensity); setNote(r.note ?? ''); when.reset(r.at);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

  const d = Number(duration);
  const valid = d > 0 && d <= 1440 && (type !== 'Outro' || custom.trim());

  async function save() {
    const data = { activityType: type === 'Outro' ? custom.trim() : type, durationMin: d, intensity, note: note.trim() || undefined, at: when.iso() };
    if (editId) await repo.activities.update(editId, data); else await repo.activities.add(data);
    toast(t('Atividade registrada', 'Boa! Movimento anotado'));
    onDone();
  }

  return (
    <RecordSheet title={editId ? 'Editar atividade' : t('Registrar atividade física', 'Anotar movimento')} onClose={onDone} onSave={save} canSave={!!valid}
      onDelete={editId ? async () => { await repo.activities.remove(editId); onDone(); } : undefined}>
      <Field label="Tipo">
        <Choices label="Tipo de atividade" cols={3} options={ACTIVITY_TYPES.map((v) => ({ value: v, label: v }))} value={type} onChange={setType} />
      </Field>
      {type === 'Outro' && <TextField label="Qual atividade?" value={custom} onChange={setCustom} autoFocus />}
      <Field label="Duração (minutos)">
        <Pills label="Duração rápida" value={DURATIONS.includes(duration) ? duration : ''} onChange={setDuration} options={DURATIONS.map((v) => ({ value: v, label: `${v} min` }))} />
        <input className="input" inputMode="numeric" aria-label="Duração em minutos" value={duration} onChange={(e) => setDuration(e.target.value.replace(/\D/g, ''))} />
      </Field>
      <Field label="Intensidade">
        <Segmented label="Intensidade" value={intensity} onChange={setIntensity} options={(Object.keys(INTENSITY_LABEL) as Intensity[]).map((v) => ({ value: v, label: INTENSITY_LABEL[v] }))} />
      </Field>
      <DateTimeFields date={when.date} time={when.time} onDate={when.setDate} onTime={when.setTime} />
      <TextField label="Observação (opcional)" value={note} onChange={setNote} multiline />
    </RecordSheet>
  );
}
