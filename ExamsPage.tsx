/* Exames: anexos (PDF/JPG/PNG/foto), histórico e indicadores com evolução. */
import { useEffect, useMemo, useState } from 'react';
import { useApp } from '@/app/AppContext';
import { useData } from '@/app/useData';
import { back, useRoute } from '@/app/router';
import { repo } from '@/database/repositories';
import { Button, Card, Cat, DemoTag, Empty, Notice, SelectField, Segmented, SubHead, Switch, TextField } from '@/components/ui';
import { RecordSheet } from '@/components/ui/RecordSheet';
import { TrendLine } from '@/components/charts/SimpleCharts';
import { Icon } from '@/components/Icon';
import { INDICATOR_META } from '@/config/categories';
import { fmtDateLong, toLocalDateInput, parseLocalDate } from '@/utils/date';
import { bytes } from '@/utils/format';
import { compressImage } from '@/utils/image';
import { unlock } from '../education/achievements';
import type { Exam, ExamAttachment, ExamIndicator, ExamResult } from '@/types/models';
import { LabReaderSheet } from './LabReaderSheet';

const MAX_FILE = 15 * 1024 * 1024;

export function ExamsPage() {
  const [tab, setTab] = useState<'files' | 'indicators'>('files');
  const [examSheet, setExamSheet] = useState<{ id?: string } | null>(null);
  const [resultSheet, setResultSheet] = useState<{ id?: string; indicator?: ExamIndicator } | null>(null);
  const [reading, setReading] = useState<ExamAttachment | null>(null);
  const route = useRoute();
  useEffect(() => { if (route.query.get('novo')) setExamSheet({}); }, [route.query]);

  return (
    <div>
      <SubHead title="Exames" subtitle="Guarde laudos e acompanhe indicadores" onBack={() => back('/saude')}
        action={<Button small icon="plus" onClick={() => (tab === 'files' ? setExamSheet({}) : setResultSheet({}))}>Adicionar</Button>} />
      <label className="card clickable tight mb-3" style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
        <span className="cat lg tone-blue"><Icon name="scan" size={24} /></span>
        <div className="grow">
          <div className="strong">Ler laudo em PDF</div>
          <div className="xsmall muted">Escolha o PDF do laboratório: o app encontra os valores e você confere antes de salvar.</div>
        </div>
        <Icon name="chevronRight" />
        <input type="file" accept="application/pdf" style={{ display: 'none' }} onChange={(e) => {
          const f = e.target.files?.[0]; e.target.value = '';
          if (f) setReading({ name: f.name, type: f.type || 'application/pdf', size: f.size, blob: f });
        }} />
      </label>
      <Segmented label="Seção" value={tab} onChange={setTab} options={[{ value: 'files', label: 'Laudos e arquivos' }, { value: 'indicators', label: 'Indicadores' }]} />
      <div className="mt-3">
        {tab === 'files' ? <ExamList onOpen={(id) => setExamSheet({ id })} onAdd={() => setExamSheet({})} />
          : <Indicators onEdit={(id) => setResultSheet({ id })} onAdd={(indicator) => setResultSheet({ indicator })} />}
      </div>
      <div className="mt-4"><Notice tone="neutral">O DiaBem guarda e organiza seus exames, mas não interpreta resultados. A avaliação é feita pela sua equipe de saúde.</Notice></div>
      {examSheet && <ExamForm id={examSheet.id} onDone={() => setExamSheet(null)} />}
      {reading && <LabReaderSheet file={reading} onDone={(n) => { setReading(null); if (n) setTab('indicators'); }} />}
      {resultSheet && <ResultForm id={resultSheet.id} indicator={resultSheet.indicator} onDone={() => setResultSheet(null)} />}
    </div>
  );
}

function ExamList({ onOpen, onAdd }: { onOpen: (id: string) => void; onAdd: () => void }) {
  const { data } = useData(() => repo.exams.all(), [], ['exams']);
  const list = (data ?? []).sort((a, b) => b.date.localeCompare(a.date));
  if (data && !list.length) {
    return <Card><Empty icon="flask" title="Nenhum exame guardado" text="Anexe PDFs ou fotos dos seus laudos. Eles ficam guardados só neste aparelho." action={<Button icon="upload" onClick={onAdd}>Adicionar exame</Button>} /></Card>;
  }
  return (
    <Card className="tight">
      <div className="list">
        {list.map((e) => (
          <button key={e.id} className="list-item list-btn" onClick={() => onOpen(e.id)}>
            <Cat icon={e.attachments.some((a) => a.type === 'application/pdf') ? 'fileText' : e.attachments.length ? 'image' : 'flask'} tone="blue" />
            <div className="grow" style={{ minWidth: 0 }}>
              <div className="title row truncate" style={{ gap: 6 }}>{e.name}{e.isDemo && <DemoTag />}</div>
              <div className="sub">{fmtDateLong(parseLocalDate(e.date))}{e.lab ? ` · ${e.lab}` : ''}</div>
            </div>
            {e.attachments.length > 0 && <span className="badge gray"><Icon name="link" size={11} /> {e.attachments.length}</span>}
          </button>
        ))}
      </div>
    </Card>
  );
}

function ExamForm({ id, onDone }: { id?: string; onDone: () => void }) {
  const { toast } = useApp();
  const [name, setName] = useState('');
  const [date, setDate] = useState(toLocalDateInput());
  const [lab, setLab] = useState('');
  const [note, setNote] = useState('');
  const [files, setFiles] = useState<ExamAttachment[]>([]);
  const [error, setError] = useState('');
  const [reading, setReading] = useState<ExamAttachment | null>(null);

  useEffect(() => {
    if (!id) return;
    repo.exams.get(id).then((e) => { if (e) { setName(e.name); setDate(e.date); setLab(e.lab ?? ''); setNote(e.note ?? ''); setFiles(e.attachments); } });
  }, [id]);

  async function addFiles(list: FileList | null) {
    if (!list) return;
    setError('');
    const out: ExamAttachment[] = [];
    for (const f of Array.from(list)) {
      const ok = f.type === 'application/pdf' || f.type.startsWith('image/');
      if (!ok) { setError('Formato não suportado. Use PDF, JPG ou PNG.'); continue; }
      const blob = f.type.startsWith('image/') ? await compressImage(f, 2000, 0.88) : f;
      if (blob.size > MAX_FILE) { setError(`"${f.name}" é maior que 15 MB.`); continue; }
      out.push({ name: f.name, type: blob.type || f.type, size: blob.size, blob });
    }
    setFiles((xs) => [...xs, ...out]);
  }

  function openFile(a: ExamAttachment) {
    const url = URL.createObjectURL(a.blob);
    window.open(url, '_blank', 'noopener');
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  async function save() {
    const data = { name: name.trim(), date, lab: lab.trim() || undefined, note: note.trim() || undefined, attachments: files };
    if (id) await repo.exams.update(id, data); else { await repo.exams.add(data as Exam); await unlock('exam'); }
    toast('Exame salvo');
    onDone();
  }

  return (
    <RecordSheet title={id ? 'Exame' : 'Adicionar exame'} onClose={onDone} onSave={save} canSave={name.trim().length > 0 && !!date}
      onDelete={id ? async () => { await repo.exams.remove(id); toast('Exame excluído'); onDone(); } : undefined}>
      <TextField label="Nome do exame" value={name} onChange={setName} placeholder="Ex.: Hemoglobina glicada, perfil lipídico" autoFocus={!id} />
      <div className="input-row">
        <TextField label="Data" type="date" value={date} onChange={setDate} />
        <TextField label="Laboratório (opcional)" value={lab} onChange={setLab} />
      </div>
      <div className="field">
        <span className="field-label">Arquivos</span>
        {files.map((f, i) => (
          <div key={i} className="row card tight flat" style={{ marginTop: 0 }}>
            <Cat icon={f.type === 'application/pdf' ? 'fileText' : 'image'} tone="blue" size="sm" />
            <button className="grow list-btn" onClick={() => openFile(f)} style={{ minWidth: 0 }}>
              <div className="small strong truncate">{f.name}</div><div className="xsmall muted">{bytes(f.size)} · toque para abrir</div>
            </button>
            {id && f.type === 'application/pdf' && <button className="btn btn-sm btn-soft" onClick={() => setReading(f)}>Ler valores</button>}
            <button className="icon-btn ghost" aria-label={`Remover ${f.name}`} onClick={() => setFiles(files.filter((_, j) => j !== i))}><Icon name="trash" size={18} /></button>
          </div>
        ))}
        <div className="grid-2">
          <label className="upload" style={{ padding: 14 }}>
            <Icon name="upload" size={22} /><span className="small strong">PDF ou imagem</span>
            <input type="file" accept="application/pdf,image/jpeg,image/png,image/*" multiple onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
          </label>
          <label className="upload" style={{ padding: 14 }}>
            <Icon name="camera" size={22} /><span className="small strong">Tirar foto</span>
            <input type="file" accept="image/*" capture="environment" onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
          </label>
        </div>
        {error && <span className="small" style={{ color: 'var(--amber-ink)' }}>{error}</span>}
        <span className="hint">Os arquivos ficam guardados só neste aparelho.</span>
      </div>
      <TextField label="Observações (opcional)" value={note} onChange={setNote} multiline />
      {!id && files.some((f) => f.type === 'application/pdf') && <p className="xsmall muted">Depois de salvar, abra o exame e toque em “Ler valores” para preencher os indicadores a partir do PDF.</p>}
      {reading && id && <LabReaderSheet file={reading} examId={id} onDone={() => setReading(null)} />}
    </RecordSheet>
  );
}

function Indicators({ onEdit, onAdd }: { onEdit: (id: string) => void; onAdd: (i?: ExamIndicator) => void }) {
  const { data } = useData(() => repo.examResults.all(), [], ['examResults']);
  const groups = useMemo(() => {
    const g = new Map<string, ExamResult[]>();
    (data ?? []).forEach((r) => { const k = r.indicator === 'other' ? `other:${r.customName}` : r.indicator; g.set(k, [...(g.get(k) ?? []), r]); });
    return [...g.entries()].map(([k, list]) => ({ key: k, list: list.sort((a, b) => b.date.localeCompare(a.date)) }));
  }, [data]);

  if (data && !groups.length) {
    return <Card><Empty icon="barChart" tone="violet" title="Nenhum indicador registrado" text="Transcreva valores dos seus laudos (ex.: HbA1c, LDL) para acompanhar a evolução ao longo do tempo." action={<Button icon="plus" onClick={() => onAdd('hba1c')}>Registrar valor</Button>} /></Card>;
  }
  return (
    <div className="stack">
      {groups.map(({ key, list }) => {
        const first = list[0];
        const label = first.indicator === 'other' ? first.customName ?? 'Outro' : INDICATOR_META[first.indicator].label;
        return (
          <Card key={key}>
            <div className="card-head">
              <div><h3>{label}</h3><div className="xsmall muted">{list.length} {list.length === 1 ? 'valor' : 'valores'} · {first.unit}</div></div>
              <button className="btn btn-sm btn-soft" onClick={() => onAdd(first.indicator)}>+ Valor</button>
            </div>
            {list.length >= 2 ? <TrendLine points={list.map((r) => ({ date: r.date, value: r.value }))} unit={first.unit} />
              : <p className="xsmall muted">Com dois ou mais valores, a evolução aparece em gráfico.</p>}
            <div className="list mt-2">
              {list.slice(0, 4).map((r) => (
                <button key={r.id} className="list-item list-btn" onClick={() => onEdit(r.id)}>
                  <div className="grow"><span className="strong">{String(r.value).replace('.', ',')} {r.unit}</span>{r.isDemo && <> <DemoTag /></>}{r.verified === false && <> <span className="badge amber">Transcrito · verificar laudo</span></>}<div className="sub">{fmtDateLong(parseLocalDate(r.date))}{r.labReference ? ` · ref. do laudo: ${r.labReference}` : ''}{r.note ? ` · ${r.note}` : ''}</div></div>
                  <Icon name="chevronRight" size={16} />
                </button>
              ))}
            </div>
          </Card>
        );
      })}
      <Button variant="ghost" icon="plus" onClick={() => onAdd()}>Registrar outro indicador</Button>
    </div>
  );
}

function ResultForm({ id, indicator: initial, onDone }: { id?: string; indicator?: ExamIndicator; onDone: () => void }) {
  const { toast } = useApp();
  const [indicator, setIndicator] = useState<ExamIndicator>(initial ?? 'hba1c');
  const [customName, setCustomName] = useState('');
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState(INDICATOR_META[initial ?? 'hba1c'].unit);
  const [date, setDate] = useState(toLocalDateInput());
  const [ref, setRef] = useState('');
  const [verified, setVerified] = useState(true);
  const [rnote, setRnote] = useState('');

  useEffect(() => {
    if (!id) return;
    repo.examResults.get(id).then((r) => { if (r) { setIndicator(r.indicator); setCustomName(r.customName ?? ''); setValue(String(r.value).replace('.', ',')); setUnit(r.unit); setDate(r.date); setRef(r.labReference ?? ''); setVerified(r.verified !== false); setRnote(r.note ?? ''); } });
  }, [id]);

  const n = Number(value.replace(',', '.'));
  const valid = value !== '' && Number.isFinite(n) && (indicator !== 'other' || customName.trim());

  async function save() {
    const data = { indicator, customName: indicator === 'other' ? customName.trim() : undefined, value: n, unit: unit.trim(), date, labReference: ref.trim() || undefined, verified, note: rnote.trim() || undefined };
    if (id) await repo.examResults.update(id, data); else await repo.examResults.add(data);
    toast('Valor registrado');
    onDone();
  }

  return (
    <RecordSheet title={id ? 'Editar valor' : 'Registrar indicador'} onClose={onDone} onSave={save} canSave={!!valid}
      onDelete={id ? async () => { await repo.examResults.remove(id); onDone(); } : undefined}>
      <SelectField label="Indicador" value={indicator} onChange={(v) => { setIndicator(v); if (!id) setUnit(INDICATOR_META[v].unit); }}
        options={(Object.keys(INDICATOR_META) as ExamIndicator[]).map((k) => ({ value: k, label: INDICATOR_META[k].label }))} />
      {indicator === 'other' && <TextField label="Nome do indicador" value={customName} onChange={setCustomName} />}
      <div className="input-row">
        <TextField label="Valor" value={value} onChange={(v) => setValue(v.replace(/[^0-9.,]/g, ''))} inputMode="decimal" />
        <TextField label="Unidade" value={unit} onChange={setUnit} hint="Como está no laudo" />
      </div>
      <TextField label="Data do exame" type="date" value={date} onChange={setDate} />
      <TextField label="Valor de referência do laudo (opcional)" value={ref} onChange={setRef} placeholder="Copie como está impresso" />
      <Switch label="Conferido no laudo original" hint="Desligue se o valor veio de memória, mensagem ou resumo." checked={verified} onChange={setVerified} />
      <TextField label="Observação (opcional)" value={rnote} onChange={setRnote} />
    </RecordSheet>
  );
}
