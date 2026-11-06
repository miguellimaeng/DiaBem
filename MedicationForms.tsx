import { useEffect, useState } from 'react';
import { useApp } from '@/app/AppContext';
import { useData } from '@/app/useData';
import { repo } from '@/database/repositories';
import { Button, Choices, DateTimeFields, Empty, Field, Notice, SelectField, Switch, TextField } from '@/components/ui';
import { RecordSheet, useWhen } from '@/components/ui/RecordSheet';
import { FREQUENCY_LABEL, MED_STATUS_META } from '@/config/categories';
import type { MedicationFrequency, MedicationStatus } from '@/types/models';
import type { FormProps } from '../glucose/GlucoseForm';

/** Registro rápido: tomei / não tomei / adiei. */
export function MedicationIntakeForm({ editId, preset, onDone }: FormProps) {
  const { toast, openQuick, t } = useApp();
  const { data: meds } = useData(() => repo.medications.all(), [], ['medications']);
  const active = (meds ?? []).filter((m) => m.active);
  const [medId, setMedId] = useState<string>(String(preset?.medicationId ?? ''));
  const [status, setStatus] = useState<MedicationStatus>((preset?.status as MedicationStatus) ?? 'taken');
  const [note, setNote] = useState('');
  const when = useWhen();

  useEffect(() => { if (!medId && active[0]) setMedId(active[0].id); }, [active, medId]);
  useEffect(() => {
    if (!editId) return;
    repo.medicationRecords.get(editId).then((r) => { if (r) { setMedId(r.medicationId); setStatus(r.status); setNote(r.note ?? ''); when.reset(r.at); } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

  const med = active.find((m) => m.id === medId) ?? (meds ?? []).find((m) => m.id === medId);

  async function save() {
    if (!med) return;
    const data = { medicationId: med.id, medicationName: med.name, status, note: note.trim() || undefined, at: when.iso(), scheduledTime: preset?.scheduledTime as string | undefined };
    if (editId) await repo.medicationRecords.update(editId, data); else await repo.medicationRecords.add(data);
    toast(`${med.name}: ${MED_STATUS_META[status].label.toLowerCase()}`);
    onDone();
  }

  if (meds && !active.length) {
    return (
      <RecordSheet title={t('Medicamento', 'Remédio')} onClose={onDone}>
        <Empty icon="pill" tone="green" title="Nenhum medicamento cadastrado" text="Cadastre seus medicamentos uma vez e depois registre com um toque."
          action={<Button icon="plus" onClick={() => openQuick('medication', { preset: { editor: true } })}>Cadastrar medicamento</Button>} />
      </RecordSheet>
    );
  }

  return (
    <RecordSheet title={editId ? 'Editar registro' : t('Registrar medicamento', 'Anotar remédio')} onClose={onDone} onSave={save} canSave={!!med}
      onDelete={editId ? async () => { await repo.medicationRecords.remove(editId); onDone(); } : undefined}>
      <Field label="Qual medicamento?">
        <Choices label="Medicamento" value={medId} onChange={setMedId} options={active.map((m) => ({ value: m.id, label: `${m.name}${m.dose ? ' · ' + m.dose : ''}` }))} />
      </Field>
      <Field label="Situação">
        <Choices label="Situação" cols={3} value={status} onChange={setStatus}
          options={(Object.keys(MED_STATUS_META) as MedicationStatus[]).map((v) => ({ value: v, label: MED_STATUS_META[v].label }))} />
      </Field>
      <DateTimeFields date={when.date} time={when.time} onDate={when.setDate} onTime={when.setTime} />
      <TextField label="Observação (opcional)" value={note} onChange={setNote} multiline />
      <button className="btn btn-ghost btn-sm" onClick={() => openQuick('medication', { preset: { editor: true } })}>Cadastrar outro medicamento</button>
    </RecordSheet>
  );
}

/** Cadastro do medicamento (nome, dose, horários, frequência, lembrete). */
export function MedicationEditor({ editId, onDone }: FormProps) {
  const { toast } = useApp();
  const [name, setName] = useState('');
  const [dose, setDose] = useState('');
  const [times, setTimes] = useState<string[]>(['08:00']);
  const [frequency, setFrequency] = useState<MedicationFrequency>('daily');
  const [note, setNote] = useState('');
  const [reminder, setReminder] = useState(false);
  const [important, setImportant] = useState(false);
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (!editId) return;
    repo.medications.get(editId).then((m) => {
      if (!m) return;
      setName(m.name); setDose(m.dose); setTimes(m.times.length ? m.times : ['']); setFrequency(m.frequency);
      setNote(m.note ?? ''); setReminder(m.reminder); setImportant(!!m.important); setActive(m.active);
    });
  }, [editId]);

  async function save() {
    const data = { name: name.trim(), dose: dose.trim(), times: times.filter(Boolean).sort(), frequency, note: note.trim() || undefined, reminder, important, active };
    if (editId) await repo.medications.update(editId, data); else await repo.medications.add(data);
    toast('Medicamento salvo');
    onDone();
  }

  return (
    <RecordSheet title={editId ? 'Editar medicamento' : 'Cadastrar medicamento'} onClose={onDone} onSave={save} canSave={name.trim().length > 0}
      onDelete={editId ? async () => { await repo.medications.remove(editId); toast('Medicamento removido'); onDone(); } : undefined}>
      <TextField label="Nome" value={name} onChange={setName} placeholder="Como está na receita" autoFocus />
      <TextField label="Dose" value={dose} onChange={setDose} placeholder="Ex.: 1 comprimido de 500 mg" hint="Copie exatamente como foi prescrito." />
      <SelectField label="Frequência" value={frequency} onChange={setFrequency}
        options={(Object.keys(FREQUENCY_LABEL) as MedicationFrequency[]).map((v) => ({ value: v, label: FREQUENCY_LABEL[v] }))} />
      <Field label="Horários">
        <div className="stack-sm">
          {times.map((tm, i) => (
            <div key={i} className="row">
              <input className="input" type="time" aria-label={`Horário ${i + 1}`} value={tm} onChange={(e) => setTimes(times.map((x, j) => (j === i ? e.target.value : x)))} />
              {times.length > 1 && <button className="icon-btn" aria-label="Remover horário" onClick={() => setTimes(times.filter((_, j) => j !== i))}>×</button>}
            </div>
          ))}
          <button className="btn btn-ghost btn-sm" onClick={() => setTimes([...times, ''])}>+ Adicionar horário</button>
        </div>
      </Field>
      <TextField label="Observações (opcional)" value={note} onChange={setNote} multiline placeholder="Ex.: tomar após o café" />
      <Switch label="Lembrete" hint="Aviso no horário enquanto o app estiver aberto (lembretes em segundo plano chegam numa próxima versão)." checked={reminder} onChange={setReminder} />
      <Switch label="Mostrar na tela de emergência" checked={important} onChange={setImportant} />
      {editId && <Switch label="Em uso" checked={active} onChange={setActive} />}
      <Notice tone="neutral">O DiaBem não altera nem sugere medicamentos. Qualquer mudança deve ser feita com seu médico.</Notice>
    </RecordSheet>
  );
}
