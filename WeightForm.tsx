import { useEffect, useId, useState } from 'react';
import { useApp } from '@/app/AppContext';
import { repo } from '@/database/repositories';
import { DateTimeFields, Field, TextField } from '@/components/ui';
import { RecordSheet, useWhen } from '@/components/ui/RecordSheet';
import type { FormProps } from '../glucose/GlucoseForm';

export function WeightForm({ editId, onDone }: FormProps) {
  const { toast, t } = useApp();
  const [value, setValue] = useState('');
  const [note, setNote] = useState('');
  const when = useWhen();
  const id = useId();

  useEffect(() => {
    if (editId) repo.weights.get(editId).then((r) => { if (r) { setValue(String(r.weightKg).replace('.', ',')); setNote(r.note ?? ''); when.reset(r.at); } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

  const n = Number(value.replace(',', '.'));
  const valid = value !== '' && Number.isFinite(n) && n >= 2 && n <= 400;

  async function save() {
    const data = { weightKg: Math.round(n * 10) / 10, note: note.trim() || undefined, at: when.iso() };
    if (editId) await repo.weights.update(editId, data); else await repo.weights.add(data);
    toast(t('Peso registrado', 'Peso anotado!'));
    onDone();
  }

  return (
    <RecordSheet title={editId ? 'Editar peso' : 'Registrar peso'} onClose={onDone} onSave={save} canSave={valid}
      onDelete={editId ? async () => { await repo.weights.remove(editId); toast('Registro excluído'); onDone(); } : undefined}>
      <Field label="Peso (kg)" htmlFor={id} hint="Use sempre a mesma balança e, se possível, o mesmo horário.">
        <input id={id} className="input input-big" inputMode="decimal" placeholder="00,0" value={value} onChange={(e) => setValue(e.target.value.replace(/[^0-9.,]/g, ''))} />
      </Field>
      <DateTimeFields date={when.date} time={when.time} onDate={when.setDate} onTime={when.setTime} />
      <TextField label="Observação (opcional)" value={note} onChange={setNote} placeholder="Ex.: em jejum, com roupa leve" />
    </RecordSheet>
  );
}
