/* Estatísticas — tendências sem julgamento. Incentiva constância. */
import { useMemo, useState } from 'react';
import { useApp } from '@/app/AppContext';
import { useData } from '@/app/useData';
import { back } from '@/app/router';
import { repo } from '@/database/repositories';
import { Card, Notice, Pills, Section, Stat, SubHead } from '@/components/ui';
import { DayBars } from '@/components/charts/SimpleCharts';
import { addDays, endOfDay, fmtWeekday, startOfDay, fmtDateShort } from '@/utils/date';
import { computeStats, formatGlucose } from '@/utils/glucose';
import { currentStreak } from '../education/achievements';

export function StatisticsPage() {
  const { settings, t } = useApp();
  const [days, setDays] = useState<'7' | '30' | '90'>('30');
  const n = Number(days);
  const from = useMemo(() => addDays(startOfDay(), -(n - 1)), [n]);

  const { data } = useData(async () => {
    const to = endOfDay();
    const [g, m, a, mr, ins, lp, streak] = await Promise.all([
      repo.glucose.between(from, to), repo.meals.between(from, to), repo.activities.between(from, to),
      repo.medicationRecords.between(from, to), repo.insulin.between(from, to), repo.learningProgress.all(), currentStreak(),
    ]);
    const all = [...g, ...m, ...a, ...mr, ...ins];
    const daysWith = new Set(all.map((r) => new Date(r.at).toDateString())).size;
    const barDays = Math.min(n, 14);
    const bars = Array.from({ length: barDays }, (_, i) => {
      const d = addDays(startOfDay(), -(barDays - 1 - i));
      return { label: barDays <= 7 ? fmtWeekday(d) : String(d.getDate()), value: all.filter((r) => new Date(r.at).toDateString() === d.toDateString()).length };
    });
    return { g, m, a, mr, ins, daysWith, bars, barDays, streak, lessons: lp.filter((p) => p.completedAt).length };
  }, [from.getTime()]);

  const stats = data ? computeStats(data.g, settings.targetRange) : null;
  const unit = settings.glucoseUnit;

  return (
    <div>
      <SubHead title="Estatísticas" subtitle="Seus hábitos de registro ao longo do tempo" onBack={() => back('/saude')} />
      <Pills label="Período" value={days} onChange={setDays} options={[{ value: '7', label: '7 dias' }, { value: '30', label: '30 dias' }, { value: '90', label: '90 dias' }]} />

      {data && (
        <>
          <Card className="mt-3">
            <div className="row-between">
              <div>
                <div className="stat-value">{data.daysWith} <small>de {n} dias</small></div>
                <div className="xsmall muted">dias com algum registro</div>
              </div>
              {data.streak > 1 && <span className="badge amber">{data.streak} dias seguidos</span>}
            </div>
            <div className="mt-3"><DayBars data={data.bars} label={`Registros por dia nos últimos ${data.barDays} dias`} /></div>
            <p className="xsmall muted mt-2">Registros por dia · últimos {data.barDays} dias (desde {fmtDateShort(addDays(startOfDay(), -(data.barDays - 1)))})</p>
          </Card>

          <Section title="Resumo do período" />
          <div className="grid-3">
            <Stat value={data.g.length} label="Medições de glicose" />
            <Stat value={stats?.avg != null ? formatGlucose(stats.avg, unit) : '—'} unit={stats?.avg != null ? unit : undefined} label="Média da glicose" />
            <Stat value={data.m.length} label="Refeições registradas" />
            <Stat value={data.a.length} label="Atividades físicas" />
            <Stat value={data.a.reduce((s, x) => s + x.durationMin, 0)} unit="min" label="Tempo em movimento" />
            <Stat value={data.mr.filter((r) => r.status === 'taken').length + data.ins.length} label="Medicamentos/insulina registrados" />
            <Stat value={data.lessons} label="Aulas concluídas" />
          </div>

          <div className="mt-4">
            <Notice tone="info" icon="sparkles">
              {data.daysWith === 0
                ? t('Que tal começar hoje? Um registro já ajuda.', 'Vamos começar? Anote uma coisa hoje!')
                : t(`Você registrou em ${data.daysWith} dia${data.daysWith > 1 ? 's' : ''}. Cada registro ajuda a entender sua rotina.`, `Você anotou em ${data.daysWith} dia${data.daysWith > 1 ? 's' : ''}. Mandou bem!`)}
            </Notice>
          </div>
        </>
      )}
    </div>
  );
}
