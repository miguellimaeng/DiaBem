/* Lê um laudo em PDF, propõe os valores encontrados e só salva o que a pessoa confirmar. */
import { useEffect, useState } from 'react';
import { useApp } from '@/app/AppContext';
import { repo } from '@/database/repositories';
import { Button, Notice, Sheet, TextField } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { INDICATOR_META } from '@/config/categories';
import { extractPdfText } from '@/services/exams/pdfText';
import { parseLabText, type ParsedResult } from '@/services/exams/labParser';
import { toLocalDateInput } from '@/utils/date';
import { unlock } from '../education/achievements';
import type { ExamAttachment, ExamResult } from '@/types/models';
import { useData } from '@/app/useData';

type Row = ParsedResult & { keep: boolean; valueText: string };

const sameKind = (a: { indicator: string; customName?: string }, b: { indicator: string; customName?: string }) =>
  a.indicator === b.indicator && (a.indicator !== 'other' || a.customName === b.customName);

export function LabReaderSheet({ file, examId, onDone }: { file: ExamAttachment; examId?: string; onDone: (saved: number) => void }) {
  const { toast } = useApp();
  const [state, setState] = useState<'reading' | 'review' | 'empty' | 'image' | 'error'>('reading');
  const [rows, setRows] = useState<Row[]>([]);
  const [date, setDate] = useState(toLocalDateInput());
  const [dateFound, setDateFound] = useState(false);
  const [name, setName] = useState('');
  const [lab, setLab] = useState('');
  const [busy, setBusy] = useState(false);
  const { data: existing } = useData(() => repo.examResults.all(), [], ['examResults']);
  const prior = (r: Row): ExamResult | undefined => (existing ?? []).find((e) => sameKind(e, r) && e.date === date && !e.isDemo);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (file.type !== 'application/pdf') { setState('image'); return; }
      try {
        const { text } = await extractPdfText(file.blob);
        if (!alive) return;
        if (text.replace(/\s/g, '').length < 40) { setState('image'); return; }
        const parsed = parseLabText(text);
        if (parsed.date) { setDate(parsed.date); setDateFound(true); }
        if (parsed.lab) setLab(parsed.lab);
        setName(parsed.results.length === 1 ? labelOf(parsed.results[0]) : 'Exames laboratoriais');
        setRows(parsed.results.map((r) => ({ ...r, keep: true, valueText: String(r.value).replace('.', ',') })));
        setState(parsed.results.length ? 'review' : 'empty');
      } catch (e) {
        console.error(e);
        if (alive) setState('error');
      }
    })();
    return () => { alive = false; };
  }, [file]);

  const kept = rows.filter((r) => r.keep && Number.isFinite(Number(r.valueText.replace(',', '.'))) && r.valueText !== '');

  async function save() {
    setBusy(true);
    try {
      let id = examId;
      if (!id) {
        const ex = await repo.exams.add({ name: name.trim() || 'Exames laboratoriais', date, lab: lab.trim() || undefined, attachments: [file], note: 'Valores lidos automaticamente do PDF e conferidos.' });
        id = ex.id;
        await unlock('exam');
      }
      for (const r of kept) {
        const v = Number(r.valueText.replace(',', '.'));
        const old = prior(r);
        if (old && Math.abs(old.value - v) < 1e-9) {
          // já existia (ex.: transcrito de conversa) e confere com o laudo → marca como conferido
          await repo.examResults.update(old.id, { verified: true, examId: old.examId ?? id, note: `Conferido com o laudo “${file.name}”` });
          continue;
        }
        if (old && old.verified === false) await repo.examResults.update(old.id, { note: `Diferente do laudo “${file.name}” (no PDF: ${r.valueText} ${r.unit})` });
        await repo.examResults.add({
          examId: id, indicator: r.indicator, customName: r.customName, value: Number(r.valueText.replace(',', '.')), unit: r.unit, date,
          labReference: r.labReference, verified: true, note: `Lido do PDF “${file.name}” e conferido`,
        });
      }
      toast(`${kept.length} ${kept.length === 1 ? 'valor salvo' : 'valores salvos'}`);
      onDone(kept.length);
    } finally { setBusy(false); }
  }

  const set = (i: number, patch: Partial<Row>) => setRows(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  return (
    <Sheet open title="Ler laudo" onClose={() => onDone(0)}
      footer={state === 'review'
        ? <><Button variant="ghost" onClick={() => onDone(0)}>Cancelar</Button><Button icon="check" disabled={busy || !kept.length} onClick={save}>Salvar {kept.length} {kept.length === 1 ? 'valor' : 'valores'}</Button></>
        : <Button onClick={() => onDone(0)}>Fechar</Button>}>
      <div className="stack">
        <div className="row small muted" style={{ gap: 8 }}><Icon name="fileText" size={16} /> <span className="truncate">{file.name}</span></div>

        {state === 'reading' && <div className="empty"><span className="cat lg tone-blue"><Icon name="scan" size={24} /></span><strong>Lendo o laudo…</strong><p className="small">A leitura acontece no próprio aparelho. Nada é enviado para a internet.</p></div>}

        {state === 'image' && <Notice tone="warm" icon="image">Este arquivo é uma foto ou um PDF escaneado (imagem), e a leitura automática de imagens ainda não está disponível. Os valores podem ser digitados em <b>Indicadores → Adicionar</b>; o arquivo fica guardado no exame.</Notice>}
        {state === 'empty' && <Notice tone="warm" icon="info">Não encontrei valores conhecidos neste laudo (HbA1c, glicose, colesterol, creatinina e outros). Você pode digitar os valores em <b>Indicadores → Adicionar</b>.</Notice>}
        {state === 'error' && <Notice tone="warm" icon="alert">Não foi possível ler este PDF. Ele pode estar protegido por senha ou danificado.</Notice>}

        {state === 'review' && (
          <>
            <Notice tone="info" icon="eye">Confira cada valor com o laudo antes de salvar. Desmarque o que estiver errado ou corrija o número.</Notice>
            {!examId && (
              <div className="input-row">
                <TextField label="Nome do exame" value={name} onChange={setName} />
                <TextField label="Laboratório" value={lab} onChange={setLab} />
              </div>
            )}
            <TextField label="Data do exame (coleta)" type="date" value={date} onChange={(v) => { setDate(v); setDateFound(true); }}
              hint={dateFound ? 'Encontrada no laudo — confira.' : 'Não encontrei a data no laudo. Informe a data da coleta.'} />
            <div className="stack-sm">
              {rows.map((r, i) => (
                <div key={i} className="card tight flat" style={{ opacity: r.keep ? 1 : 0.55 }}>
                  <div className="row" style={{ alignItems: 'flex-start', gap: 10 }}>
                    <input type="checkbox" checked={r.keep} onChange={(e) => set(i, { keep: e.target.checked })} aria-label={`Salvar ${labelOf(r)}`} style={{ width: 22, height: 22, marginTop: 4 }} />
                    <div className="grow" style={{ minWidth: 0 }}>
                      <div className="strong small">{labelOf(r)}</div>
                      <div className="row mt-2" style={{ gap: 6 }}>
                        <input className="input" style={{ maxWidth: 110, minHeight: 40 }} inputMode="decimal" aria-label={`Valor de ${labelOf(r)}`} value={r.valueText} onChange={(e) => set(i, { valueText: e.target.value.replace(/[^0-9.,]/g, '') })} />
                        <span className="small muted">{r.unit}</span>
                      </div>
                      <div className="xsmall muted mt-2" style={{ wordBreak: 'break-word' }}>No laudo: “{r.source}”</div>
                      {(() => {
                        const old = prior(r);
                        if (!old) return null;
                        const same = Math.abs(old.value - Number(r.valueText.replace(',', '.'))) < 1e-9;
                        return same
                          ? <span className="badge green mt-2"><Icon name="checkCircle" size={11} /> Confere com o valor já registrado</span>
                          : <span className="badge amber mt-2"><Icon name="alert" size={11} /> Diferente do registrado antes: {String(old.value).replace('.', ',')} {old.unit}</span>;
                      })()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="xsmall muted">O DiaBem guarda os valores e mostra a evolução. A interpretação é da sua equipe de saúde.</p>
          </>
        )}
      </div>
    </Sheet>
  );
}

const labelOf = (r: ParsedResult) => (r.indicator === 'other' ? r.customName ?? 'Outro' : INDICATOR_META[r.indicator].label);
