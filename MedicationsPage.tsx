/* Medicamentos: rotina de hoje + cadastro. */
import { useApp } from '@/app/AppContext';
import { useData } from '@/app/useData';
import { back } from '@/app/router';
import { repo } from '@/database/repositories';
import { Button, Card, Cat, DemoTag, Empty, Notice, Section, SubHead } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { FREQUENCY_LABEL, MED_STATUS_META } from '@/config/categories';
import { endOfDay, fmtTime, fromLocalInputs, startOfDay, toLocalDateInput } from '@/utils/date';
import type { MedicationStatus } from '@/types/models';
import { InsulinPlanCard } from '../insulin/InsulinPlan';

export function MedicationsPage() {
  const { openQuick, toast } = useApp();
  const { data } = useData(async () => {
    const [meds, recs] = await Promise.all([repo.medications.all(), repo.medicationRecords.between(startOfDay(), endOfDay())]);
    return { meds: meds.sort((a, b) => a.name.localeCompare(b.name)), recs };
  }, [], ['medications', 'medicationRecords']);

  const active = (data?.meds ?? []).filter((m) => m.active && m.frequency !== 'as_needed');
  const doses = active.flatMap((m) => m.times.map((t) => ({ med: m, time: t, rec: data?.recs.find((r) => r.medicationId === m.id && r.scheduledTime === t) })))
    .sort((a, b) => a.time.localeCompare(b.time));

  async function mark(medId: string, name: string, time: string, status: MedicationStatus, recId?: string) {
    const today = toLocalDateInput();
    if (recId) await repo.medicationRecords.update(recId, { status, at: new Date().toISOString() });
    else await repo.medicationRecords.add({ medicationId: medId, medicationName: name, status, scheduledTime: time, at: status === 'taken' ? new Date().toISOString() : fromLocalInputs(today, time) });
    toast(`${name}: ${MED_STATUS_META[status].label.toLowerCase()}`);
  }

  return (
    <div>
      <SubHead title="Medicamentos" subtitle="Sua rotina e seus registros" onBack={() => back('/saude')}
        action={<Button small icon="plus" onClick={() => openQuick('medication', { preset: { editor: true } })}>Cadastrar</Button>} />

      <Section title="Insulina" />
      <InsulinPlanCard />
      <Button block variant="ghost" icon="syringe" className="mt-3" onClick={() => openQuick('insulin')}>Registrar aplicação de insulina</Button>

      <Section title="Outros medicamentos" />
      {data && !data.meds.length ? (
        <Card><Empty icon="pill" tone="green" title="Nenhum medicamento cadastrado" text="Cadastre nome, dose e horários como estão na sua receita." action={<Button icon="plus" onClick={() => openQuick('medication', { preset: { editor: true } })}>Cadastrar medicamento</Button>} /></Card>
      ) : (
        <>
          <div className="small strong muted mb-2">Hoje</div>
          {doses.length ? (
            <div className="stack-sm">
              {doses.map(({ med, time, rec }) => (
                <Card key={med.id + time} className="tight">
                  <div className="row">
                    <Cat icon="pill" tone="green" />
                    <div className="grow" style={{ minWidth: 0 }}>
                      <div className="strong row truncate" style={{ gap: 6 }}>{med.name}{med.isDemo && <DemoTag />}</div>
                      <div className="xsmall muted">{time} · {med.dose}</div>
                    </div>
                    {rec && <span className={`badge ${rec.status === 'taken' ? 'green' : rec.status === 'postponed' ? 'amber' : 'gray'}`}>{MED_STATUS_META[rec.status].label}{rec.status === 'taken' ? ` ${fmtTime(rec.at)}` : ''}</span>}
                  </div>
                  <div className="grid-3 mt-3" role="group" aria-label={`Situação de ${med.name} às ${time}`}>
                    {(['taken', 'postponed', 'not_taken'] as MedicationStatus[]).map((s) => (
                      <button key={s} className="choice center" aria-pressed={rec?.status === s} style={{ padding: '8px 4px', minHeight: 40 }} onClick={() => mark(med.id, med.name, time, s, rec?.id)}>
                        {MED_STATUS_META[s].label}
                      </button>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          ) : <Card><p className="small muted">Sem horários programados para hoje.</p></Card>}

          <Section title="Meus medicamentos" />
          <Card className="tight">
            <div className="list">
              {(data?.meds ?? []).map((m) => (
                <button key={m.id} className="list-item list-btn" onClick={() => openQuick('medication', { editId: m.id, preset: { editor: true } })}>
                  <div className="grow" style={{ minWidth: 0 }}>
                    <div className="title row" style={{ gap: 6, opacity: m.active ? 1 : 0.5 }}>{m.name}{!m.active && <span className="badge gray">Fora de uso</span>}{m.important && <Icon name="shield" size={13} style={{ color: 'var(--rose)' }} />}</div>
                    <div className="sub">{m.dose} · {FREQUENCY_LABEL[m.frequency]}{m.times.length ? ` · ${m.times.join(', ')}` : ''}</div>
                  </div>
                  {m.reminder && <Icon name="bell" size={15} style={{ color: 'var(--muted)' }} />}
                  <Icon name="chevronRight" size={16} />
                </button>
              ))}
            </div>
          </Card>
          <Button block variant="ghost" icon="history" className="mt-3" onClick={() => openQuick('medication')}>Registrar dose fora do horário</Button>
        </>
      )}
      <div className="mt-4"><Notice tone="neutral">O DiaBem não altera, sugere ou interrompe medicamentos. Mudanças sempre com seu médico.</Notice></div>
    </div>
  );
}
