import { useEffect, useState } from 'react';
import { useApp } from '@/app/AppContext';
import { repo } from '@/database/repositories';
import { Choices, DateTimeFields, Field, Notice, TextField } from '@/components/ui';
import { RecordSheet, useWhen } from '@/components/ui/RecordSheet';
import { MOOD_META, SYMPTOMS } from '@/config/categories';
import type { MoodLevel } from '@/types/models';
import type { FormProps } from '../glucose/GlucoseForm';

export function MoodForm({ editId, onDone }: FormProps) {
  const { toast, t } = useApp();
  const [mood, setMood] = useState<MoodLevel>('good');
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const when = useWhen();

  useEffect(() => {
    if (!editId) return;
    repo.moods.get(editId).then((r) => { if (r) { setMood(r.mood); setSymptoms(r.symptoms); setNote(r.note ?? ''); when.reset(r.at); } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

  const toggle = (s: string) => setSymptoms((xs) => (xs.includes(s) ? xs.filter((x) => x !== s) : [...xs, s]));

  async function save() {
    const data = { mood, symptoms, note: note.trim() || undefined, at: when.iso() };
    if (editId) await repo.moods.update(editId, data); else await repo.moods.add(data);
    toast(t('Registro salvo', 'Obrigado por contar como você está!'));
    onDone();
  }

  return (
    <RecordSheet title={t('Como estou', 'Como você está se sentindo?')} onClose={onDone} onSave={save}
      onDelete={editId ? async () => { await repo.moods.remove(editId); onDone(); } : undefined}>
      <Choices label="Como você está" cols={3} value={mood} onChange={setMood}
        options={(Object.keys(MOOD_META) as MoodLevel[]).map((v) => ({ value: v, label: MOOD_META[v].label }))} />
      <Field label="Sintomas (opcional)" hint="Toque em quantos quiser.">
        <Choices label="Sintomas" multi value={symptoms} onChange={toggle} options={SYMPTOMS.map((s) => ({ value: s, label: s }))} />
      </Field>
      <TextField label="Quer contar mais? (opcional)" value={note} onChange={setNote} multiline />
      <DateTimeFields date={when.date} time={when.time} onDate={when.setDate} onTime={when.setTime} />
      {symptoms.length > 0 && (
        <Notice tone="neutral">Sintomas ficam no seu histórico e no resumo da consulta. Se você não estiver bem, siga seu plano de cuidados ou procure ajuda.</Notice>
      )}
    </RecordSheet>
  );
}
