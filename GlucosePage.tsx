/* Glicose — "Como meus registros estão evoluindo?" */
import { useEffect, useMemo, useState } from 'react';
import { useApp } from '@/app/AppContext';
import { useData } from '@/app/useData';
import { navigate, useRoute, ROUTES } from '@/app/router';
import { repo } from '@/database/repositories';
import { Button, Card, DemoTag, Empty, PageHead, Pills, Section, Stat, Notice, TextField } from '@/components/ui';
import { GlucoseChart, DistributionBar } from '@/components/charts/GlucoseChart';
import { Icon } from '@/components/Icon';
import { addDays, endOfDay, fmtDateTime, startOfDay, toLocalDateInput, parseLocalDate } from '@/utils/date';
import { computeStats, CONTEXT_LABEL, formatGlucose, rangeState, RANGE_LABEL, TREND_LABEL } from '@/utils/glucose';
import { RangeEditor } from './RangeEditor';
import type { GlucoseContext } from '@/types/models';

type Period = 'today' | '7' | '30' | '90' | 'custom';
const PERIODS: { value: Period; label: string }[] = [
  { value: 'today', label: 'Hoje' }, { value: '7', label: '7 dias' }, { value: '30', label: '30 dias' }, { value: '90', label: '90 dias' }, { value: 'custom', label: 'Personalizado' },
];

export function GlucosePage() {
  const { settings, openQuick, t, mode } = useApp();
  const route = useRoute();
  const unit = settings.glucoseUnit;
  const range = settings.targetRange;
  const [period, setPeriod] = useState<Period>('7');
  const [customFrom, setCustomFrom] = useState(toLocalDateInput(addDays(new Date(), -14)));
  const [customTo, setCustomTo] = useState(toLocalDateInput());
  const [rangeOpen, setRangeOpen] = useState(false);
  const [ctx, setCtx] = useState<GlucoseContext | 'all'>('all');

  useEffect(() => {
    if (route.query.get('faixa')) { setRangeOpen(true); navigate(ROUTES.glucose, { replace: true }); }
    if (route.query.get('novo')) { openQuick('glucose'); navigate(ROUTES.glucose, { replace: true }); }
  }, [route.query, openQuick]);

  const { from, to } = useMemo(() => {
    if (period === 'today') return { from: startOfDay(), to: endOfDay() };
    if (period === 'custom') return { from: startOfDay(parseLocalDate(customFrom)), to: endOfDay(parseLocalDate(customTo)) };
    return { from: addDays(startOfDay(), -(Number(period) - 1)), to: endOfDay() };
  }, [period, customFrom, customTo]);

  const { data: all } = useData(() => repo.glucose.between(from, to), [from.getTime(), to.getTime()], ['glucose']);
  const records = useMemo(() => (all ?? []).filter((r) => ctx === 'all' || r.context === ctx), [all, ctx]);
  const stats = computeStats(records, range);
  const recent = [...records].reverse().slice(0, mode === 'easy' ? 5 : 8);
  const trendIcon = stats.trend === 'up' ? 'trendUp' : stats.trend === 'down' ? 'trendDown' : 'minus';

  return (
    <div>
      <PageHead title="Glicose" subtitle={t('Como meus registros estão evoluindo?', 'Veja como sua glicose andou')}
        action={<Button small icon="plus" onClick={() => openQuick('glucose')}>Registrar</Button>} />

      <Pills label="Período" options={PERIODS} value={period} onChange={setPeriod} />
      {period === 'custom' && (
        <div className="input-row mt-2">
          <TextField label="De" type="date" value={customFrom} onChange={setCustomFrom} />
          <TextField label="Até" type="date" value={customTo} onChange={setCustomTo} />
        </div>
      )}

      <Card className="mt-3">
        <div className="card-head">
          <h3>Evolução</h3>
          {range ? <span className="badge green">Faixa {formatGlucose(range.lowMgdl, unit)}–{formatGlucose(range.highMgdl, unit)}</span>
            : <button className="btn btn-sm btn-soft" onClick={() => setRangeOpen(true)}>Definir faixa</button>}
        </div>
        {records.length ? (
          <GlucoseChart records={records} range={range} unit={unit} from={from} to={to} />
        ) : (
          <Empty icon="drop" title="Sem medições neste período" text="Os registros aparecem aqui assim que você adicionar." action={<Button small icon="plus" onClick={() => openQuick('glucose')}>Registrar glicose</Button>} />
        )}
        {records.some((r) => r.isDemo) && <p className="xsmall muted mt-2">Inclui dados de demonstração.</p>}
      </Card>

      {mode !== 'child' && (
        <div className="pills mt-3" role="group" aria-label="Filtrar por momento">
          <button className="pill" aria-pressed={ctx === 'all'} onClick={() => setCtx('all')}>Todos os momentos</button>
          {(Object.keys(CONTEXT_LABEL) as GlucoseContext[]).map((c) => (
            <button key={c} className="pill" aria-pressed={ctx === c} onClick={() => setCtx(c)}>{CONTEXT_LABEL[c]}</button>
          ))}
        </div>
      )}

      <div className="grid-3 mt-3">
        <Stat value={stats.avg != null ? formatGlucose(stats.avg, unit) : '—'} label="Média" />
        <Stat value={stats.min != null ? formatGlucose(stats.min, unit) : '—'} label="Mínimo" />
        <Stat value={stats.max != null ? formatGlucose(stats.max, unit) : '—'} label="Máximo" />
        <Stat value={stats.count} label="Medições" />
        <Stat value={<span className="row" style={{ gap: 4, fontSize: 'var(--fs-md)' }}><Icon name={trendIcon} size={18} />{TREND_LABEL[stats.trend]}</span>} label="Tendência" />
        <Stat value={stats.daysWithRecords} label="Dias com registro" />
      </div>

      <Section title="Tempo dentro da faixa" />
      <Card>
        {range ? (
          stats.count ? (
            <>
              <div className="row-between mb-3">
                <div>
                  <div className="stat-value" style={{ color: 'var(--green-ink)' }}>{Math.round(stats.inRange ?? 0)}%</div>
                  <div className="xsmall muted">das medições dentro da sua faixa</div>
                </div>
                <button className="btn btn-sm btn-ghost" onClick={() => setRangeOpen(true)}>Editar faixa</button>
              </div>
              <DistributionBar below={stats.below ?? 0} inRange={stats.inRange ?? 0} above={stats.above ?? 0} />
              <p className="xsmall muted mt-3">Calculado sobre as medições registradas (não é tempo contínuo de sensor). Faixa definida {range.definedBy === 'professional' ? 'pelo seu profissional' : 'por você'}.</p>
            </>
          ) : <p className="small muted">Registre medições para ver a distribuição.</p>
        ) : (
          <div className="stack-sm">
            <p className="small">Para ver quanto das suas medições ficou dentro da faixa, informe a faixa orientada pela sua equipe de saúde.</p>
            <Button variant="soft" icon="target" onClick={() => setRangeOpen(true)}>Definir minha faixa</Button>
          </div>
        )}
      </Card>

      <Section title="Últimas medições" />
      <Card>
        {recent.length ? (
          <div className="list">
            {recent.map((r) => {
              const st = rangeState(r.valueMgdl, range);
              return (
                <button key={r.id} className="list-item list-btn" onClick={() => openQuick('glucose', { editId: r.id })} aria-label={`${formatGlucose(r.valueMgdl, unit)} ${unit}, ${CONTEXT_LABEL[r.context]}, ${fmtDateTime(r.at)}. Editar.`}>
                  <span className="cat sm tone-blue"><Icon name="drop" size={16} /></span>
                  <div className="grow">
                    <div className="title row" style={{ gap: 6 }}>{formatGlucose(r.valueMgdl, unit)} <span className="xsmall muted">{unit}</span>{r.isDemo && <DemoTag />}</div>
                    <div className="sub">{CONTEXT_LABEL[r.context]} · {fmtDateTime(r.at)}{r.note ? ` · ${r.note}` : ''}</div>
                  </div>
                  {st !== 'unset' && <span className={`badge ${st === 'in' ? 'green' : 'amber'}`}>{RANGE_LABEL[st].replace(' da faixa', '')}</span>}
                </button>
              );
            })}
          </div>
        ) : <p className="small muted">Nenhuma medição neste período.</p>}
      </Card>

      <div className="mt-3">
        <Notice tone="neutral">Os gráficos mostram seus registros, sem interpretação médica. Leve-os para conversar com sua equipe.</Notice>
      </div>

      {rangeOpen && <RangeEditor onClose={() => setRangeOpen(false)} />}
    </div>
  );
}
