/* Emergência — tela rápida, grande e legível, com o que o usuário escolheu mostrar. */
import { useEffect, useState } from 'react';
import { useApp } from '@/app/AppContext';
import { useData } from '@/app/useData';
import { back } from '@/app/router';
import { repo } from '@/database/repositories';
import { Button, Card, Notice, Section, SelectField, SubHead, Switch, TextField } from '@/components/ui';
import { RecordSheet } from '@/components/ui/RecordSheet';
import { Icon } from '@/components/Icon';
import { APP_CONFIG } from '@/config/app.config';
import { DIABETES_TYPE_LABEL } from '@/config/categories';
import { nowISO } from '@/utils/date';
import type { DiabetesType, EmergencyContact, EmergencyProfile } from '@/types/models';

export function EmergencyPage() {
  const { profile } = useApp();
  const [edit, setEdit] = useState(false);
  const { data } = useData(async () => {
    const [e, meds, plan] = await Promise.all([repo.emergency.get(), repo.medications.all(), repo.insulinPlan.all()]);
    const insulins = [...new Set(plan.filter((p) => p.active).map((p) => p.name))];
    return { e, important: meds.filter((m) => m.active && m.important), insulins };
  }, [], ['emergency', 'medications', 'insulinPlan']);
  const e = data?.e;
  const name = e?.showName ? e.name || profile?.name : undefined;
  const meds = [e?.importantMeds, ...(data?.important ?? []).map((m) => `${m.name}${m.dose ? ` (${m.dose})` : ''}`)].filter(Boolean).join(' · ');

  return (
    <div>
      <SubHead title="Emergência" onBack={() => back('/saude')} action={<Button small variant="ghost" icon="edit" onClick={() => setEdit(true)}>Editar</Button>} />

      <section className="emergency-card" aria-label="Informações de emergência">
        <div className="row" style={{ gap: 10 }}>
          <span className="cat lg tone-rose"><Icon name="alert" size={26} /></span>
          <h2>Tenho diabetes</h2>
        </div>
        <dl>
          {name && <div><dt>Nome</dt><dd>{name}</dd></div>}
          <div><dt>Tipo</dt><dd>{DIABETES_TYPE_LABEL[e?.diabetesType ?? profile?.diabetesType ?? 'unspecified']}</dd></div>
          {!!data?.insulins.length && <div><dt>Usa insulina</dt><dd>{data.insulins.join(', ')}</dd></div>}
          {meds && <div><dt>Medicamentos importantes</dt><dd>{meds}</dd></div>}
          {e?.allergies && <div><dt>Alergias</dt><dd>{e.allergies}</dd></div>}
          {e?.notes && <div><dt>Observações</dt><dd>{e.notes}</dd></div>}
        </dl>
        {!e && <p className="small muted mt-3">Toque em Editar para escolher o que aparece aqui.</p>}
      </section>

      {!!e?.contacts.length && (
        <>
          <Section title="Contatos de emergência" />
          <div className="stack-sm">
            {e.contacts.map((c, i) => (
              <a key={i} className="card clickable tight row" href={`tel:${c.phone.replace(/[^\d+]/g, '')}`} style={{ textDecoration: 'none' }}>
                <span className="cat tone-rose"><Icon name="phone" /></span>
                <div className="grow"><div className="strong">{c.name}</div><div className="small muted">{c.relation ? `${c.relation} · ` : ''}{c.phone}</div></div>
                <span className="btn btn-sm btn-danger">Ligar</span>
              </a>
            ))}
          </div>
        </>
      )}

      <Section title="Serviços de emergência" />
      <div className="grid-2">
        {APP_CONFIG.emergencyNumbers.map((n) => (
          <a key={n.number} href={`tel:${n.number}`} className="card clickable tight center" style={{ textDecoration: 'none', color: 'var(--ink)' }}>
            <div style={{ fontFamily: 'var(--font-title)', fontWeight: 800, fontSize: 'var(--fs-2xl)', color: 'var(--rose-ink)' }}>{n.number}</div>
            <div className="small strong">{n.label}</div>
          </a>
        ))}
      </div>
      <div className="mt-4"><Notice tone="neutral" icon="smartphone">Dica: use o atalho “Emergência” ao manter pressionado o ícone do app instalado.</Notice></div>

      {edit && <EmergencyEditor current={e} onDone={() => setEdit(false)} />}
    </div>
  );
}

function EmergencyEditor({ current, onDone }: { current?: EmergencyProfile; onDone: () => void }) {
  const { profile, toast } = useApp();
  const [showName, setShowName] = useState(current?.showName ?? true);
  const [name, setName] = useState(current?.name ?? profile?.name ?? '');
  const [type, setType] = useState<DiabetesType>(current?.diabetesType ?? profile?.diabetesType ?? 'unspecified');
  const [meds, setMeds] = useState(current?.importantMeds ?? '');
  const [allergies, setAllergies] = useState(current?.allergies ?? '');
  const [notes, setNotes] = useState(current?.notes ?? '');
  const [contacts, setContacts] = useState<EmergencyContact[]>(current?.contacts.length ? current.contacts : [{ name: '', phone: '', relation: '' }]);
  useEffect(() => { if (!current && profile?.name) setName(profile.name); }, [current, profile?.name]);

  async function save() {
    await repo.emergency.set({
      id: 'emergency', showName, name: name.trim() || undefined, diabetesType: type, importantMeds: meds.trim(), allergies: allergies.trim() || undefined,
      notes: notes.trim() || undefined, contacts: contacts.filter((c) => c.name.trim() && c.phone.trim()), updatedAt: nowISO(),
    });
    toast('Tela de emergência atualizada');
    onDone();
  }

  const setC = (i: number, patch: Partial<EmergencyContact>) => setContacts(contacts.map((c, j) => (j === i ? { ...c, ...patch } : c)));

  return (
    <RecordSheet title="Dados de emergência" onClose={onDone} onSave={save}>
      <Notice tone="info" icon="lock">Você escolhe o que aparece. Estes dados ficam só neste aparelho.</Notice>
      <Switch label="Mostrar meu nome" checked={showName} onChange={setShowName} />
      {showName && <TextField label="Nome" value={name} onChange={setName} />}
      <SelectField label="Tipo de diabetes" value={type} onChange={setType} options={(Object.keys(DIABETES_TYPE_LABEL) as DiabetesType[]).map((k) => ({ value: k, label: DIABETES_TYPE_LABEL[k] }))} />
      <TextField label="Medicamentos importantes" value={meds} onChange={setMeds} multiline placeholder="Ex.: uso insulina" hint="Medicamentos marcados como “mostrar na emergência” também aparecem." />
      <TextField label="Alergias (opcional)" value={allergies} onChange={setAllergies} />
      <TextField label="Observações (opcional)" value={notes} onChange={setNotes} multiline placeholder="Ex.: em caso de hipoglicemia, tenho balas na bolsa" />
      <div className="field">
        <span className="field-label">Contatos de emergência</span>
        {contacts.map((c, i) => (
          <Card key={i} className="tight flat" as="div">
            <div className="stack-sm">
              <input className="input" placeholder="Nome" aria-label={`Nome do contato ${i + 1}`} value={c.name} onChange={(e) => setC(i, { name: e.target.value })} />
              <div className="input-row">
                <input className="input" placeholder="Telefone" type="tel" aria-label={`Telefone do contato ${i + 1}`} value={c.phone} onChange={(e) => setC(i, { phone: e.target.value })} />
                <input className="input" placeholder="Relação (ex.: mãe)" aria-label={`Relação do contato ${i + 1}`} value={c.relation ?? ''} onChange={(e) => setC(i, { relation: e.target.value })} />
              </div>
              {contacts.length > 1 && <button className="btn btn-sm btn-ghost" onClick={() => setContacts(contacts.filter((_, j) => j !== i))}>Remover contato</button>}
            </div>
          </Card>
        ))}
        <button className="btn btn-sm btn-ghost" onClick={() => setContacts([...contacts, { name: '', phone: '', relation: '' }])}>+ Adicionar contato</button>
      </div>
    </RecordSheet>
  );
}
