import { useEffect, useState } from 'react';
import { useApp } from '@/app/AppContext';
import { repo } from '@/database/repositories';
import { DateTimeFields, Field, Notice, Segmented, SelectField, TextField } from '@/components/ui';
import { useData } from '@/app/useData';
import { INSULIN_MOMENT_LABEL } from '@/config/categories';
import { ConfirmBadge, sortPlan } from './InsulinPlan';
import { RecordSheet, useWhen } from '@/components/ui/RecordSheet';
import { INSULIN_KIND_LABEL } from '@/config/categories';
import type { InsulinKind, InsulinPlanItem, InsulinRecord } from '@/types/models';
import type { FormProps } from '../glucose/GlucoseForm';

export function InsulinForm({ editId, onDone }: FormProps) {
  const { toast } = useApp();
  const [kind, setKind] = useState<InsulinKind>('bolus');
  const [name, setName] = useState('');
  const [dose, setDose] = useState('');
  const [unit, setUnit] = useState<InsulinRecord['unit']>('U');
  const [note, setNote] = useState('');
  const when = useWhen();
  const { data: planAll } = useData(() => repo.insulinPlan.all(), [], ['insulinPlan']);
  const plan = sortPlan((planAll ?? []).filter((p) => p.active));
  const [planId, setPlanId] = useState<string | null>(null);
  const picked: InsulinPlanItem | undefined = plan.find((p) => p.id === planId);

  function pick(p: InsulinPlanItem) {
    setPlanId(p.id); setKind(p.kind); setName(p.name + (p.concentration ? ` ${p.concentration}` : ''));
    setNote(INSULIN_MOMENT_LABEL[p.moment]);
  }

  useEffect(() => {
    if (editId) {
      repo.insulin.get(editId).then((r) => {
        if (!r) return;
        setKind(r.kind); setName(r.name ?? ''); setDose(String(r.dose).replace('.', ',')); setUnit(r.unit); setNote(r.note ?? ''); when.reset(r.at);
      });
    } else {
      // Sugere apenas o NOME usado por último para o tipo — nunca a dose.
      repo.insulin.latest(1).then(([r]) => { if (r?.name) setName(r.name); });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

  const n = Number(dose.replace(',', '.'));
  const valid = dose !== '' && Number.isFinite(n) && n > 0 && n <= 300;

  async function save() {
    const data = { kind, name: name.trim() || undefined, dose: n, unit, note: note.trim() || undefined, at: when.iso() };
    if (editId) await repo.insulin.update(editId, data); else await repo.insulin.add(data);
    toast('Insulina registrada');
    onDone();
  }

  return (
    <RecordSheet title={editId ? 'Editar insulina' : 'Registrar insulina'} onClose={onDone} onSave={save} canSave={valid}
      onDelete={editId ? async () => { await repo.insulin.remove(editId); toast('Registro excluído'); onDone(); } : undefined}>
      <Notice tone="info" icon="shield">Apenas registro do que foi aplicado. O DiaBem não calcula nem sugere doses de insulina.</Notice>
      {!editId && plan.length > 0 && (
        <Field label="Qual aplicação da receita?" hint="Toque para preencher a insulina. A dose aplicada é você quem confirma.">
          <div className="choices">
            {plan.map((p) => (
              <button key={p.id} type="button" className="choice" aria-pressed={planId === p.id} onClick={() => pick(p)} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
                <span className="strong">{INSULIN_MOMENT_LABEL[p.moment]}</span>
                <span className="xsmall">{p.name} · {String(p.doseUnits).replace('.', ',')} UI</span>
              </button>
            ))}
          </div>
        </Field>
      )}
      {picked && (
        <div className="card tight flat" style={{ marginTop: 0 }}>
          <div className="row-between wrap" style={{ gap: 8 }}>
            <div><div className="small">Na receita cadastrada: <b>{String(picked.doseUnits).replace('.', ',')} UI</b></div><ConfirmBadge confirmed={picked.confirmed} /></div>
            <button type="button" className="btn btn-sm btn-soft" onClick={() => setDose(String(picked.doseUnits).replace('.', ','))}>Apliquei esta dose</button>
          </div>
        </div>
      )}
      <Segmented label="Tipo de insulina" value={kind} onChange={setKind}
        options={(Object.keys(INSULIN_KIND_LABEL) as InsulinKind[]).map((v) => ({ value: v, label: INSULIN_KIND_LABEL[v] }))} />
      <TextField label="Nome da insulina (opcional)" value={name} onChange={setName} placeholder="Como está escrito na caneta ou frasco" />
      <div className="input-row">
        <TextField label="Dose que foi aplicada" value={dose} onChange={(v) => setDose(v.replace(/[^0-9.,]/g, ''))} inputMode="decimal" placeholder="0" />
        <SelectField label="Unidade" value={unit} onChange={setUnit} options={[{ value: 'U', label: 'Unidades (U)' }, { value: 'mL', label: 'mL' }, { value: 'other', label: 'Outra' }]} />
      </div>
      <DateTimeFields date={when.date} time={when.time} onDate={when.setDate} onTime={when.setTime} />
      <TextField label="Observação (opcional)" value={note} onChange={setNote} multiline placeholder="Ex.: aplicada no abdômen" />
    </RecordSheet>
  );
}
