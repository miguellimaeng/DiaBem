import { useEffect, useState } from 'react';
import { useApp } from '@/app/AppContext';
import { repo } from '@/database/repositories';
import { Choices, DateTimeFields, TextField } from '@/components/ui';
import { RecordSheet, useWhen } from '@/components/ui/RecordSheet';
import { DAY_EVENT_META } from '@/config/categories';
import type { DayEventKind } from '@/types/models';
import type { FormProps } from '../glucose/GlucoseForm';

export function EventForm({ editId, onDone }: FormProps) {
  const { toast } = useApp();
  const [kind, setKind] = useState<DayEventKind>('note');
  const [title, setTitle] = useState('');
  const [detail, setDetail] = useState('');
  const when = useWhen();

  useEffect(() => {
    if (!editId) return;
    repo.dayEvents.get(editId).then((r) => { if (r) { setKind(r.kind); setTitle(r.title); setDetail(r.detail ?? ''); when.reset(r.at); } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

  const finalTitle = title.trim() || DAY_EVENT_META[kind].label;

  async function save() {
    const data = { kind, title: finalTitle, detail: detail.trim() || undefined, at: when.iso() };
    if (editId) await repo.dayEvents.update(editId, data); else await repo.dayEvents.add(data);
    toast('Evento adicionado ao seu dia');
    onDone();
  }

  return (
    <RecordSheet title={editId ? 'Editar evento' : 'Adicionar evento'} onClose={onDone} onSave={save}
      onDelete={editId ? async () => { await repo.dayEvents.remove(editId); onDone(); } : undefined}>
      <Choices label="Tipo de evento" value={kind} onChange={setKind}
        options={(Object.keys(DAY_EVENT_META) as DayEventKind[]).map((v) => ({ value: v, label: DAY_EVENT_META[v].label, icon: DAY_EVENT_META[v].icon, tone: DAY_EVENT_META[v].tone }))} />
      <TextField label="Título" value={title} onChange={setTitle} placeholder={kind === 'sleep' ? 'Ex.: Acordei' : 'Ex.: Dia corrido no trabalho'} />
      <TextField label="Detalhe (opcional)" value={detail} onChange={setDetail} multiline placeholder={kind === 'sleep' ? 'Ex.: dormi bem, 7 horas' : ''} />
      <DateTimeFields date={when.date} time={when.time} onDate={when.setDate} onTime={when.setTime} />
    </RecordSheet>
  );
}
