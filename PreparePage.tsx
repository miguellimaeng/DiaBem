/* Preparar consulta / Relatório visual — imprimível (Salvar como PDF) e exportável em CSV. */
import { useEffect, useMemo, useState } from 'react';
import { useApp } from '@/app/AppContext';
import { useData } from '@/app/useData';
import { back } from '@/app/router';
import { Button, Card, Notice, Pills, Section, Stat, SubHead, Switch, TextField } from '@/components/ui';
import { GlucoseChart, DistributionBar } from '@/components/charts/GlucoseChart';
import { QuestionsCard } from '../appointments/QuestionsCard';
import { buildReport } from './reportData';
import { addDays, endOfDay, fmtDateLong, fmtDateTime, parseLocalDate, startOfDay, toLocalDateInput } from '@/utils/date';
import { CONTEXT_LABEL, formatGlucose, TREND_LABEL } from '@/utils/glucose';
import { INDICATOR_META, INSULIN_KIND_LABEL, INSULIN_MOMENT_LABEL, MEAL_LABEL, MOOD_META } from '@/config/categories';
import { HistoryNotesCard } from '../health/HistoryNotesCard';
import { sortPlan } from '../insulin/InsulinPlan';
import { download, toCSV } from '@/services/export';
import { unlock } from '../education/achievements';
import { APP_CONFIG } from '@/config/app.config';
import type { MoodLevel } from '@/types/models';

type Period = '7' | '30' | '90' | 'custom';

export function PreparePage() {
  const { settings, profile, toast } = useApp();
  const unit = settings.glucoseUnit;
  const [period, setPeriod] = useState<Period>('30');
  const [cFrom, setCFrom] = useState(toLocalDateInput(addDays(new Date(), -30)));
  const [cTo, setCTo] = useState(toLocalDateInput());
  const [includeDemo, setIncludeDemo] = useState(settings.demoLoaded);

  const { from, to } = useMemo(() => period === 'custom'
    ? { from: startOfDay(parseLocalDate(cFrom)), to: endOfDay(parseLocalDate(cTo)) }
    : { from: addDays(startOfDay(), -(Number(period) - 1)), to: endOfDay() }, [period, cFrom, cTo]);

  const { data: r } = useData(() => buildReport(from, to, settings.targetRange, includeDemo), [from.getTime(), to.getTime(), includeDemo, settings.targetRange?.updatedAt]);

  useEffect(() => { unlock('report'); }, []);

  function exportCSV() {
    if (!r) return;
    const rows = [
      ...r.glucose.map((g) => ({ tipo: 'Glicose', data: fmtDateTime(g.at), valor: formatGlucose(g.valueMgdl, unit), unidade: unit, detalhe: CONTEXT_LABEL[g.context], obs: g.note ?? '', demo: g.isDemo ? 'sim' : '' })),
      ...r.insulin.map((i) => ({ tipo: 'Insulina', data: fmtDateTime(i.at), valor: String(i.dose).replace('.', ','), unidade: i.unit, detalhe: `${INSULIN_KIND_LABEL[i.kind]} ${i.name ?? ''}`.trim(), obs: i.note ?? '', demo: i.isDemo ? 'sim' : '' })),
      ...r.meals.map((m) => ({ tipo: 'Refeição', data: fmtDateTime(m.at), valor: m.carbsGrams ?? '', unidade: m.carbsGrams != null ? 'g carb.' : '', detalhe: `${MEAL_LABEL[m.mealType]}: ${m.description}`, obs: m.note ?? '', demo: m.isDemo ? 'sim' : '' })),
      ...r.acts.map((a) => ({ tipo: 'Atividade', data: fmtDateTime(a.at), valor: a.durationMin, unidade: 'min', detalhe: a.activityType, obs: a.note ?? '', demo: a.isDemo ? 'sim' : '' })),
    ].sort((a, b) => a.data.localeCompare(b.data));
    const csv = toCSV(rows, [
      { key: 'tipo', label: 'Tipo' }, { key: 'data', label: 'Data e hora' }, { key: 'valor', label: 'Valor' }, { key: 'unidade', label: 'Unidade' },
      { key: 'detalhe', label: 'Detalhe' }, { key: 'obs', label: 'Observação' }, { key: 'demo', label: 'Demonstração' },
    ]);
    download(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }), `diabem-registros-${toLocalDateInput(from)}-a-${toLocalDateInput(to)}.csv`);
    toast('CSV exportado');
  }

  return (
    <div className="report">
      <div className="no-print">
        <SubHead title="Preparar consulta" subtitle="Resumo dos seus registros para levar ao médico" onBack={() => back('/saude')} />
        <Pills label="Período" value={period} onChange={setPeriod} options={[{ value: '7', label: '7 dias' }, { value: '30', label: '30 dias' }, { value: '90', label: '90 dias' }, { value: 'custom', label: 'Personalizado' }]} />
        {period === 'custom' && (
          <div className="input-row mt-2">
            <TextField label="De" type="date" value={cFrom} onChange={setCFrom} />
            <TextField label="Até" type="date" value={cTo} onChange={setCTo} />
          </div>
        )}
        {settings.demoLoaded && <Card className="tight mt-3" as="div"><Switch label="Incluir dados de demonstração" hint="Desligue para levar ao médico apenas registros reais." checked={includeDemo} onChange={setIncludeDemo} /></Card>}

        <Section title="Perguntas para meu médico" />
        <QuestionsCard compact />
      </div>

      {r && (
        <>
          <Card className="mt-4">
            <div className="row-between">
              <div>
                <div className="xsmall muted strong" style={{ textTransform: 'uppercase', letterSpacing: '.06em' }}>Resumo para consulta · {APP_CONFIG.name}</div>
                <h2 className="mt-2">{profile?.name || 'Meus registros'}</h2>
                <div className="small muted">{fmtDateLong(from)} a {fmtDateLong(to)}</div>
              </div>
            </div>
            {r.hasDemo && <div className="mt-3"><Notice tone="warm">Este resumo contém dados de demonstração, que não são registros reais.</Notice></div>}
          </Card>

          <Section title="Glicose" />
          <Card>
            <div className="grid-3">
              <Stat value={r.stats.avg != null ? formatGlucose(r.stats.avg, unit) : '—'} label={`Média (${unit})`} />
              <Stat value={r.stats.min != null ? formatGlucose(r.stats.min, unit) : '—'} label="Mínimo" />
              <Stat value={r.stats.max != null ? formatGlucose(r.stats.max, unit) : '—'} label="Máximo" />
              <Stat value={r.stats.count} label="Medições" />
              <Stat value={r.stats.daysWithRecords} label="Dias com registro" />
              <Stat value={TREND_LABEL[r.stats.trend]} label="Tendência" />
            </div>
            {r.glucose.length > 0 && <div className="mt-3"><GlucoseChart records={r.glucose} range={settings.targetRange} unit={unit} from={from} to={to} height={170} /></div>}
            {settings.targetRange && r.stats.count > 0 && (
              <div className="mt-3">
                <div className="small strong mb-2">Distribuição na faixa {formatGlucose(settings.targetRange.lowMgdl, unit)}–{formatGlucose(settings.targetRange.highMgdl, unit)} {unit}</div>
                <DistributionBar below={r.stats.below ?? 0} inRange={r.stats.inRange ?? 0} above={r.stats.above ?? 0} />
              </div>
            )}
            {r.byContext.length > 0 && (
              <table className="small mt-3" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr className="xsmall muted"><th style={{ textAlign: 'left', padding: '6px 0' }}>Momento</th><th style={{ textAlign: 'right' }}>Medições</th><th style={{ textAlign: 'right' }}>Média</th></tr></thead>
                <tbody>{r.byContext.map((c) => (
                  <tr key={c.context} style={{ borderTop: '1px solid var(--line)' }}>
                    <td style={{ padding: '7px 0' }}>{CONTEXT_LABEL[c.context]}</td><td style={{ textAlign: 'right' }}>{c.count}</td><td style={{ textAlign: 'right' }}>{c.avg != null ? formatGlucose(c.avg, unit) : '—'}</td>
                  </tr>
                ))}</tbody>
              </table>
            )}
          </Card>

          <Section title="Medicamentos e insulina" />
          <Card>
            {r.medSummary.length ? r.medSummary.map((m) => (
              <div key={m.med.id} className="list-item">
                <div className="grow"><div className="title">{m.med.name}</div><div className="sub">{m.med.dose}{m.med.times.length ? ` · ${m.med.times.join(', ')}` : ''}</div></div>
                <span className="xsmall muted">{m.taken} tomados · {m.postponed} adiados · {m.notTaken} não tomados</span>
              </div>
            )) : <p className="small muted">Nenhum medicamento cadastrado.</p>}
            {r.plan.length > 0 && (
              <div className="mt-3">
                <div className="small strong mb-2">Esquema de insulina cadastrado {r.plan.some((p) => !p.confirmed) && <span className="badge amber">contém itens a confirmar na receita</span>}</div>
                <table className="small" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>{sortPlan(r.plan).map((p) => (
                    <tr key={p.id} style={{ borderTop: '1px solid var(--line)' }}>
                      <td style={{ padding: '6px 0' }}>{INSULIN_MOMENT_LABEL[p.moment]}</td>
                      <td>{p.name}{p.concentration ? ` ${p.concentration}` : ''}</td>
                      <td style={{ textAlign: 'right' }}>{String(p.doseUnits).replace('.', ',')} UI{p.confirmed ? '' : ' *'}</td>
                    </tr>
                  ))}</tbody>
                </table>
                {r.plan.some((p) => !p.confirmed) && <p className="xsmall muted mt-2">* Transcrição pendente de conferência na receita original.</p>}
              </div>
            )}
            <div className="mt-3 small">
              <b>Aplicações registradas:</b> {r.insulin.length ? `${r.insulin.length} registros (${r.insulin.filter((i) => i.kind === 'basal').length} basal, ${r.insulin.filter((i) => i.kind === 'bolus').length} bolus, ${r.insulin.filter((i) => i.kind === 'other').length} outros)` : 'nenhum registro no período.'}
            </div>
          </Card>

          <Section title="Rotina" />
          <div className="grid-3">
            <Stat value={r.meals.length} label="Refeições registradas" />
            <Stat value={r.acts.length} label="Atividades" />
            <Stat value={r.activityMinutes} unit="min" label="Tempo de atividade" />
          </div>
          {r.meals.length > 0 && (
            <Card className="mt-3">
              <div className="small strong mb-2">Refeições recentes</div>
              {r.meals.slice(-5).reverse().map((m) => <div key={m.id} className="xsmall" style={{ padding: '4px 0' }}><span className="muted">{fmtDateTime(m.at)} · {MEAL_LABEL[m.mealType]}:</span> {m.description}{m.carbsGrams != null ? ` (${m.carbsGrams} g carb.)` : ''}</div>)}
            </Card>
          )}

          <Section title="Como estou e sintomas" />
          <Card>
            {r.moods.length ? (
              <>
                <div className="row wrap" style={{ gap: 6 }}>{[...r.moodCount.entries()].map(([k, n]) => <span key={k} className="badge gray">{MOOD_META[k as MoodLevel].label}: {n}</span>)}</div>
                {r.symptoms.length > 0 && <p className="small mt-3"><b>Sintomas registrados:</b> {r.symptoms.map(([s, n]) => `${s} (${n}x)`).join(', ')}</p>}
              </>
            ) : <p className="small muted">Nenhum registro de humor ou sintomas no período.</p>}
          </Card>

          <Section title="Exames" />
          <Card>
            {r.latestResults.length ? r.latestResults.map((x) => (
              <div key={x.id} className="list-item"><div className="grow"><div className="title">{x.indicator === 'other' ? x.customName : INDICATOR_META[x.indicator].label}</div><div className="sub">{fmtDateLong(parseLocalDate(x.date))}</div></div><div style={{ textAlign: 'right' }}><span className="strong">{String(x.value).replace('.', ',')} {x.unit}</span>{x.verified === false && <div className="xsmall" style={{ color: 'var(--amber-ink)' }}>transcrito · verificar laudo</div>}</div></div>
            )) : <p className="small muted">Nenhum indicador registrado.</p>}
            {r.exams.length > 0 && <p className="xsmall muted mt-2">Laudos guardados: {r.exams.map((e) => e.name).join(', ')}.</p>}
          </Card>

          <div className="mt-3"><HistoryNotesCard printable /></div>

          {r.notes.length > 0 && (
            <>
              <Section title="Observações" />
              <Card>{r.notes.slice(0, 12).map((n, i) => <div key={i} className="xsmall" style={{ padding: '4px 0' }}><span className="muted">{fmtDateTime(n.at)} · {n.kind}:</span> {n.text}</div>)}</Card>
            </>
          )}

          {r.questions.length > 0 && (
            <>
              <Section title="Minhas perguntas" />
              <Card><ol className="small" style={{ margin: 0, paddingLeft: 20 }}>{r.questions.map((q) => <li key={q.id} style={{ padding: '3px 0' }}>{q.text}</li>)}</ol></Card>
            </>
          )}

          <p className="disclaimer">{APP_CONFIG.medicalDisclaimer} Relatório gerado em {fmtDateTime(new Date().toISOString())}.</p>

          <div className="grid-2 no-print mt-3">
            <Button icon="printer" onClick={() => window.print()}>Imprimir / PDF</Button>
            <Button variant="soft" icon="download" onClick={exportCSV}>Exportar CSV</Button>
          </div>
        </>
      )}
    </div>
  );
}
