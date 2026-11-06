/* Consultas: agenda, lembretes e perguntas para o médico. */
import { useEffect, useState } from 'react';
import { useApp } from '@/app/AppContext';
import { useData } from '@/app/useData';
import { back, navigate, useRoute } from '@/app/router';
import { repo } from '@/database/repositories';
import { Button, Card, DemoTag, Empty, Section, SelectField, SubHead, Switch, TextField } from '@/components/ui';
import { RecordSheet } from '@/components/ui/RecordSheet';
import { Icon } from '@/components/Icon';
import { SPECIALTY_LABEL } from '@/config/categories';
import { addDays, daysUntil, fmtMonthShort, fmtTime, fromLocalInputs, toLocalDateInput, toLocalTimeInput } from '@/utils/date';
import { requestNotificationPermission } from '@/services/reminders';
import type { Appointment, Specialty } from '@/types/models';
import { QuestionsCard } from './QuestionsCard';

export function AppointmentsPage() {
  const route = useRoute();
  const [sheet, setSheet] = useState<{ id?: string } | null>(null);
  useEffect(() => { if (route.query.get('novo')) setSheet({}); }, [route.query]);
  const { data } = useData(() => repo.appointments.all(), [], ['appointments']);
  const now = Date.now();
  const upcoming = (data ?? []).filter((a) => new Date(a.at).getTime() >= now - 3600_000).sort((a, b) => a.at.localeCompare(b.at));
  const past = (data ?? []).filter((a) => new Date(a.at).getTime() < now - 3600_000).sort((a, b) => b.at.localeCompare(a.at));

  return (
    <div>
      <SubHead title="Consultas" subtitle="Agenda e preparo" onBack={() => back('/saude')} action={<Button small icon="plus" onClick={() => setSheet({})}>Agendar</Button>} />
      {data && !upcoming.length && (
        <Card><Empty icon="calendar" tone="teal" title="Nenhuma consulta agendada" text="Registre suas próximas consultas para lembrar e se preparar." action={<Button icon="plus" onClick={() => setSheet({})}>Agendar consulta</Button>} /></Card>
      )}
      <div className="stack">{upcoming.map((a) => <AppointmentCard key={a.id} a={a} onEdit={() => setSheet({ id: a.id })} />)}</div>

      <Section title="Perguntas para meu médico" />
      <QuestionsCard />

      {past.length > 0 && (
        <>
          <Section title="Consultas anteriores" />
          <Card className="tight"><div className="list">
            {past.slice(0, 10).map((a) => (
              <button key={a.id} className="list-item list-btn" onClick={() => setSheet({ id: a.id })}>
                <div className="grow"><div className="title">{SPECIALTY_LABEL[a.specialty]}</div><div className="sub">{new Date(a.at).toLocaleDateString('pt-BR')}{a.doctor ? ` · ${a.doctor}` : ''}</div></div>
                <Icon name="chevronRight" size={16} />
              </button>
            ))}
          </div></Card>
        </>
      )}
      {sheet && <AppointmentForm id={sheet.id} onDone={() => setSheet(null)} />}
    </div>
  );
}

function AppointmentCard({ a, onEdit }: { a: Appointment; onEdit: () => void }) {
  const d = daysUntil(a.at);
  return (
    <Card>
      <div className="row" style={{ alignItems: 'flex-start', gap: 12 }}>
        <div className="center" style={{ background: 'var(--teal-soft)', color: 'var(--teal-ink)', borderRadius: 14, padding: '8px 10px', minWidth: 58 }}>
          <div style={{ fontFamily: 'var(--font-title)', fontWeight: 800, fontSize: 'var(--fs-xl)', lineHeight: 1 }}>{new Date(a.at).getDate()}</div>
          <div className="xsmall strong">{fmtMonthShort(a.at)}</div>
        </div>
        <div className="grow">
          <div className="row" style={{ gap: 6 }}><span className="strong">{SPECIALTY_LABEL[a.specialty]}</span>{a.isDemo && <DemoTag />}</div>
          <div className="small muted">{fmtTime(a.at)}{a.doctor ? ` · ${a.doctor}` : ''}</div>
          {a.location && <div className="xsmall muted row mt-2" style={{ gap: 4 }}><Icon name="mapPin" size={12} />{a.location}</div>}
          <div className="row wrap mt-2">
            <span className="badge teal" style={{ background: 'var(--teal-soft)', color: 'var(--teal-ink)' }}>{d <= 0 ? 'Hoje' : d === 1 ? 'Amanhã' : `Em ${d} dias`}</span>
            {a.reminder && <span className="badge gray"><Icon name="bell" size={11} /> Lembrete</span>}
          </div>
        </div>
        <button className="icon-btn ghost" aria-label="Editar consulta" onClick={onEdit}><Icon name="edit" size={18} /></button>
      </div>
      <Button block variant="soft" icon="clipboard" className="mt-3" onClick={() => navigate('/saude/preparar')}>Preparar consulta</Button>
    </Card>
  );
}

function AppointmentForm({ id, onDone }: { id?: string; onDone: () => void }) {
  const { toast } = useApp();
  const [date, setDate] = useState(toLocalDateInput(addDays(new Date(), 7)));
  const [time, setTime] = useState('09:00');
  const [doctor, setDoctor] = useState('');
  const [specialty, setSpecialty] = useState<Specialty>('endocrinologist');
  const [location, setLocation] = useState('');
  const [note, setNote] = useState('');
  const [reminder, setReminder] = useState(true);

  useEffect(() => {
    if (!id) return;
    repo.appointments.get(id).then((a) => {
      if (!a) return;
      const d = new Date(a.at);
      setDate(toLocalDateInput(d)); setTime(toLocalTimeInput(d)); setDoctor(a.doctor ?? ''); setSpecialty(a.specialty);
      setLocation(a.location ?? ''); setNote(a.note ?? ''); setReminder(a.reminder);
    });
  }, [id]);

  async function save() {
    if (reminder) await requestNotificationPermission();
    const data = { at: fromLocalInputs(date, time), doctor: doctor.trim() || undefined, specialty, location: location.trim() || undefined, note: note.trim() || undefined, reminder };
    if (id) await repo.appointments.update(id, data); else await repo.appointments.add(data);
    toast('Consulta salva');
    onDone();
  }

  return (
    <RecordSheet title={id ? 'Editar consulta' : 'Agendar consulta'} onClose={onDone} onSave={save}
      onDelete={id ? async () => { await repo.appointments.remove(id); toast('Consulta removida'); onDone(); } : undefined}>
      <SelectField label="Especialidade" value={specialty} onChange={setSpecialty} options={(Object.keys(SPECIALTY_LABEL) as Specialty[]).map((s) => ({ value: s, label: SPECIALTY_LABEL[s] }))} />
      <div className="input-row">
        <TextField label="Data" type="date" value={date} onChange={setDate} />
        <TextField label="Hora" type="time" value={time} onChange={setTime} />
      </div>
      <TextField label="Médico(a) ou profissional (opcional)" value={doctor} onChange={setDoctor} />
      <TextField label="Local (opcional)" value={location} onChange={setLocation} />
      <TextField label="Observação (opcional)" value={note} onChange={setNote} multiline placeholder="Ex.: levar exames de sangue" />
      <Switch label="Lembrete" hint="Aviso no dia anterior e 2 horas antes, enquanto o app estiver aberto." checked={reminder} onChange={setReminder} />
    </RecordSheet>
  );
}
