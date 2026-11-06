/* Esquema de insulina copiado da receita: lista, editor e selo de confirmação. */
import { useEffect, useState } from 'react';
import { useApp } from '@/app/AppContext';
import { useData } from '@/app/useData';
import { repo } from '@/database/repositories';
import { Button, Card, Empty, Notice, Segmented, SelectField, Switch, TextField } from '@/components/ui';
import { RecordSheet } from '@/components/ui/RecordSheet';
import { Icon } from '@/components/Icon';
import { INSULIN_KIND_LABEL, INSULIN_MOMENT_LABEL, INSULIN_MOMENT_ORDER } from '@/config/categories';
import type { InsulinKind, InsulinMoment, InsulinPlanItem } from '@/types/models';

export const sortPlan = (xs: InsulinPlanItem[]) =>
  [...xs].sort((a, b) => INSULIN_MOMENT_ORDER.indexOf(a.moment) - INSULIN_MOMENT_ORDER.indexOf(b.moment) || a.kind.localeCompare(b.kind));

export function ConfirmBadge({ confirmed }: { confirmed: boolean }) {
  return confirmed
    ? <span className="badge green"><Icon name="checkCircle" size={11} /> Conferido na receita</span>
    : <span className="badge amber"><Icon name="alert" size={11} /> Confirmar na receita</span>;
}

/** Cartão usado em Medicamentos: mostra o esquema agrupado por momento do dia. */
export function InsulinPlanCard() {
  const [edit, setEdit] = useState<{ id?: string } | null>(null);
  const { data } = useData(() => repo.insulinPlan.all(), [], ['insulinPlan']);
  const items = sortPlan((data ?? []).filter((i) => i.active));
  const pending = items.some((i) => !i.confirmed);
  const total = (k: InsulinKind) => items.filter((i) => i.kind === k).reduce((s, i) => s + i.doseUnits, 0);

  return (
    <>
      <Card>
        <div className="card-head">
          <h3>Esquema de insulina da receita</h3>
          <button className="btn btn-sm btn-soft" onClick={() => setEdit({})}>+ Adicionar</button>
        </div>
        {data && !items.length && <Empty icon="syringe" tone="violet" title="Nenhum esquema cadastrado" text="Copie aqui o que está escrito na receita: insulina, momento do dia e dose." />}
        {items.length > 0 && (
          <>
            {pending && <div className="mb-3"><Notice tone="warm" icon="alert">Há itens ainda não conferidos na receita original. Confira com a receita ou com o médico antes de usar como referência.</Notice></div>}
            <div className="list">
              {items.map((i) => (
                <button key={i.id} className="list-item list-btn" onClick={() => setEdit({ id: i.id })}>
                  <span className="cat sm tone-violet"><Icon name="syringe" size={16} /></span>
                  <div className="grow" style={{ minWidth: 0 }}>
                    <div className="title">{INSULIN_MOMENT_LABEL[i.moment]}{i.time ? ` · ${i.time}` : ''}</div>
                    <div className="sub">{i.name}{i.concentration ? ` ${i.concentration}` : ''} · {INSULIN_KIND_LABEL[i.kind]}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="strong">{String(i.doseUnits).replace('.', ',')} UI</div>
                    {!i.confirmed && <span className="xsmall" style={{ color: 'var(--amber-ink)' }}>a confirmar</span>}
                  </div>
                </button>
              ))}
            </div>
            <p className="xsmall muted mt-3">Total transcrito por dia: {(['basal', 'bolus', 'other'] as InsulinKind[]).filter((k) => total(k)).map((k) => `${INSULIN_KIND_LABEL[k]} ${total(k)} UI`).join(' · ')}. Somente transcrição — o DiaBem não calcula nem ajusta doses.</p>
          </>
        )}
      </Card>
      {edit && <InsulinPlanEditor id={edit.id} onDone={() => setEdit(null)} />}
    </>
  );
}

export function InsulinPlanEditor({ id, onDone }: { id?: string; onDone: () => void }) {
  const { toast } = useApp();
  const [kind, setKind] = useState<InsulinKind>('basal');
  const [name, setName] = useState('');
  const [concentration, setConcentration] = useState('U-100');
  const [moment, setMoment] = useState<InsulinMoment>('before_breakfast');
  const [time, setTime] = useState('');
  const [dose, setDose] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [prescriber, setPrescriber] = useState('');
  const [prescriptionDate, setPrescriptionDate] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!id) return;
    repo.insulinPlan.get(id).then((i) => {
      if (!i) return;
      setKind(i.kind); setName(i.name); setConcentration(i.concentration ?? ''); setMoment(i.moment); setTime(i.time ?? '');
      setDose(String(i.doseUnits).replace('.', ',')); setConfirmed(i.confirmed); setPrescriber(i.prescriber ?? ''); setPrescriptionDate(i.prescriptionDate ?? ''); setNote(i.note ?? '');
    });
  }, [id]);

  const n = Number(dose.replace(',', '.'));
  const valid = name.trim() && dose !== '' && Number.isFinite(n) && n > 0 && n <= 300;

  async function save() {
    const data = {
      kind, name: name.trim(), concentration: concentration.trim() || undefined, moment, time: time || undefined, doseUnits: n,
      confirmed, prescriber: prescriber.trim() || undefined, prescriptionDate: prescriptionDate || undefined, note: note.trim() || undefined, active: true,
    };
    if (id) await repo.insulinPlan.update(id, data); else await repo.insulinPlan.add(data);
    toast('Esquema salvo');
    onDone();
  }

  return (
    <RecordSheet title={id ? 'Item do esquema' : 'Adicionar ao esquema'} onClose={onDone} onSave={save} canSave={!!valid}
      onDelete={id ? async () => { await repo.insulinPlan.remove(id); toast('Item removido'); onDone(); } : undefined}>
      <Notice tone="info" icon="shield">Copie exatamente o que está na receita. O DiaBem não cria, calcula nem altera doses.</Notice>
      <Segmented label="Tipo" value={kind} onChange={setKind} options={(Object.keys(INSULIN_KIND_LABEL) as InsulinKind[]).map((k) => ({ value: k, label: INSULIN_KIND_LABEL[k] }))} />
      <div className="input-row">
        <TextField label="Insulina" value={name} onChange={setName} placeholder="Ex.: NPH" />
        <TextField label="Concentração" value={concentration} onChange={setConcentration} placeholder="Ex.: U-100" />
      </div>
      <SelectField label="Momento" value={moment} onChange={setMoment} options={INSULIN_MOMENT_ORDER.map((m) => ({ value: m, label: INSULIN_MOMENT_LABEL[m] }))} />
      <div className="input-row">
        <TextField label="Dose da receita (UI)" value={dose} onChange={(v) => setDose(v.replace(/[^0-9.,]/g, ''))} inputMode="decimal" />
        <TextField label="Horário (opcional)" type="time" value={time} onChange={setTime} />
      </div>
      <Switch label="Conferido na receita original" hint="Deixe desligado se a informação veio de memória, mensagem ou resumo." checked={confirmed} onChange={setConfirmed} />
      <div className="input-row">
        <TextField label="Médico (opcional)" value={prescriber} onChange={setPrescriber} />
        <TextField label="Data da receita" type="date" value={prescriptionDate} onChange={setPrescriptionDate} />
      </div>
      <TextField label="Observação (opcional)" value={note} onChange={setNote} multiline />
    </RecordSheet>
  );
}

export function PlanStartButton({ onClick }: { onClick: () => void }) {
  return <Button variant="soft" icon="plus" onClick={onClick}>Cadastrar esquema da receita</Button>;
}
