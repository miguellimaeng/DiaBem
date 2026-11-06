/* Início — "Como estou hoje?" */
import { useApp } from '@/app/AppContext';
import { useData } from '@/app/useData';
import { navigate, ROUTES } from '@/app/router';
import { repo, clearDemoData } from '@/database/repositories';
import { Button, Card, Cat, DemoTag, Disclaimer, Notice, ProgressBar, Section, Stat } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { Illustration } from '@/components/Illustration';
import { KIND_META, QUICK_ORDER, SPECIALTY_LABEL } from '@/config/categories';
import { addDays, endOfDay, fmtTime, greeting, relativeFromNow, startOfDay, fmtMonthShort, daysUntil, fmtDateShort } from '@/utils/date';
import { computeStats, formatGlucose, rangeState, RANGE_LABEL } from '@/utils/glucose';
import { loadTimeline, routineProgress } from '../day/timeline';
import { lessonOfTheDay } from '../education/lessons.data';

export function HomePage() {
  const { settings, profile, openQuick, t, mode, updateSettings, toast } = useApp();
  const unit = settings.glucoseUnit;

  const { data } = useData(async () => {
    const now = new Date();
    const weekFrom = addDays(startOfDay(), -6);
    const [last, week, todayItems, acts, appts, progress] = await Promise.all([
      repo.glucose.latest(1),
      repo.glucose.between(weekFrom, now),
      loadTimeline(startOfDay(), endOfDay(), unit),
      repo.activities.between(weekFrom, now),
      repo.appointments.all(),
      repo.learningProgress.all(),
    ]);
    const next = appts.filter((a) => new Date(a.at).getTime() > Date.now() - 3600_000).sort((a, b) => a.at.localeCompare(b.at))[0];
    const completed = new Set(progress.filter((p) => p.completedAt).map((p) => p.id));
    const lesson = lessonOfTheDay(completed);
    const lessonProgress = progress.find((p) => p.id === lesson.id);
    return { last: last[0], week, todayItems, acts, next, lesson, lessonProgress, lessonsDone: completed.size };
  }, [unit]);

  const name = profile?.name?.split(' ')[0];
  const last = data?.last;
  const state = last ? rangeState(last.valueMgdl, settings.targetRange) : 'unset';
  const stats = data ? computeStats(data.week, settings.targetRange) : null;
  const routine = data ? routineProgress(data.todayItems) : null;
  const actMin = data?.acts.reduce((s, a) => s + a.durationMin, 0) ?? 0;
  const hasDemo = settings.demoLoaded;

  return (
    <div className="stack">
      <section className="hero" aria-labelledby="hero-title">
        <div id="hero-title" className="hero-greet">{greeting()}{name ? `, ${name}` : ''}</div>
        <div className="hero-sub">{t('Seu resumo de hoje.', 'Vamos ver como está seu dia?')}</div>
        {last ? (
          <div className="hero-row">
            <div>
              <div className="hero-value" aria-label={`Última glicose: ${formatGlucose(last.valueMgdl, unit)} ${unit}`}>
                {formatGlucose(last.valueMgdl, unit)}<small>{unit}</small>
              </div>
              <div className="hero-meta">Último registro • {fmtTime(last.at)} · {relativeFromNow(last.at)} {last.isDemo && <span className="demo-tag" style={{ marginLeft: 4 }}>Demo</span>}</div>
            </div>
            <button className="hero-chip" style={{ font: 'inherit', cursor: 'pointer' }}
              onClick={() => navigate(state === 'unset' ? `${ROUTES.glucose}?faixa=1` : ROUTES.glucose)}>
              <b>{state === 'in' && <Icon name="checkCircle" size={14} />}{state === 'unset' ? 'Definir faixa' : RANGE_LABEL[state]}</b>
              <span>{state === 'unset' ? 'Você escolhe sua faixa' : 'configurada por você'}</span>
            </button>
          </div>
        ) : (
          <div className="hero-empty">
            <p className="small" style={{ opacity: 0.92 }}>{t('Nenhuma glicose registrada ainda.', 'Ainda não tem glicose anotada.')}</p>
            <Button className="btn-on-hero" icon="plus" onClick={() => openQuick('glucose')}>{t('Registrar glicose', 'Anotar glicose')}</Button>
          </div>
        )}
      </section>

      {hasDemo && (
        <Notice tone="warm" icon="info">
          <div className="row-between wrap" style={{ gap: 8 }}>
            <span>Você está vendo <b>dados de demonstração</b>. Eles não são registros reais.</span>
            <button className="btn btn-sm btn-ghost" style={{ background: '#fff' }} onClick={async () => { await clearDemoData(); await updateSettings({ demoLoaded: false }); toast('Dados de demonstração removidos'); }}>
              Remover
            </button>
          </div>
        </Notice>
      )}

      <div className="grid-2">
        <Stat icon="barChart" tone="blue" value={stats?.avg != null ? formatGlucose(stats.avg, unit) : '—'} unit={stats?.avg != null ? unit : undefined} label="Média dos últimos 7 dias" />
        <Stat icon="target" tone="teal" value={routine ? `${Math.round(routine.pct)}%` : '—'} label={t('Rotina registrada hoje', 'Missões de hoje')} />
        {mode !== 'easy' && (
          <>
            <Stat icon="list" tone="violet" value={data?.todayItems.length ?? '—'} label="Registros hoje" />
            <Stat icon="footprints" tone="green" value={actMin} unit="min" label="Atividade em 7 dias" />
          </>
        )}
      </div>

      {routine && routine.done < routine.total && (
        <Card className="tight flat" as="div">
          <div className="row-between">
            <span className="small strong">{t('Rotina de hoje', 'Suas missões de hoje')}</span>
            <span className="xsmall muted">{routine.done} de {routine.total}</span>
          </div>
          <div className="mt-2"><ProgressBar value={routine.pct} label="Rotina registrada hoje" /></div>
          <p className="xsmall muted mt-2">Ainda dá para registrar: {routine.missing.map((m) => m.label.toLowerCase()).join(', ')}.</p>
        </Card>
      )}

      <Section title={t('Registrar agora', 'Anotar agora')} />
      <div className="quick">
        {(mode === 'easy' ? QUICK_ORDER.slice(0, 4) : QUICK_ORDER).map((k) => {
          const m = KIND_META[k];
          return (
            <button key={k} className="quick-btn" onClick={() => openQuick(k)}>
              <Cat icon={m.icon} tone={m.tone} />
              {t(m.label, m.labelChild)}
            </button>
          );
        })}
      </div>
      {mode === 'easy' && (
        <Button variant="ghost" block icon="calendarDay" onClick={() => navigate(ROUTES.day)}>Ver meu dia</Button>
      )}

      {data?.lesson && (
        <>
          <Section title={t('Missão educativa do dia', 'Missão do dia')} action="Ver todas" onAction={() => navigate(ROUTES.learn)} />
          <button className="card clickable" onClick={() => navigate(`${ROUTES.learn}/${data.lesson.id}`)}>
            <div className="media-row">
              <Illustration name={data.lesson.topic} size={64} />
              <div>
                <div className="title">{t(data.lesson.title, data.lesson.titleChild)}</div>
                <div className="sub row" style={{ gap: 6 }}><Icon name="clock" size={13} /> {data.lesson.minutes} minutos · {data.lesson.level}</div>
              </div>
            </div>
            <div className="mt-3"><ProgressBar value={data.lessonProgress?.completedAt ? 100 : ((data.lessonProgress?.lastCard ?? 0) / Math.max(1, data.lesson.cards.length)) * 100} label="Progresso da missão" /></div>
          </button>
        </>
      )}

      <Section title="Próxima consulta" action={data?.next ? 'Agenda' : undefined} onAction={() => navigate('/saude/consultas')} />
      {data?.next ? (
        <Card>
          <div className="row-between">
            <div className="grow">
              <div className="row" style={{ gap: 6 }}><span className="strong">{SPECIALTY_LABEL[data.next.specialty]}</span>{data.next.isDemo && <DemoTag />}</div>
              <div className="small muted">{fmtDateShort(data.next.at)} • {fmtTime(data.next.at)}{data.next.doctor ? ` · ${data.next.doctor}` : ''}</div>
              <div className="mt-2 row wrap">
                <span className="badge blue">{daysUntil(data.next.at) === 0 ? 'Hoje' : daysUntil(data.next.at) === 1 ? 'Amanhã' : `Em ${daysUntil(data.next.at)} dias`}</span>
                {data.next.reminder && <span className="badge gray"><Icon name="bell" size={11} /> Lembrete</span>}
              </div>
            </div>
            <div className="center" style={{ background: 'var(--primary-soft)', color: 'var(--primary)', borderRadius: 14, padding: '8px 12px', minWidth: 64 }}>
              <div style={{ fontFamily: 'var(--font-title)', fontWeight: 800, fontSize: 'var(--fs-xl)', lineHeight: 1 }}>{new Date(data.next.at).getDate()}</div>
              <div className="xsmall strong">{fmtMonthShort(data.next.at)}</div>
            </div>
          </div>
          <Button block variant="soft" icon="clipboard" className="mt-3" onClick={() => navigate('/saude/preparar')}>Preparar consulta</Button>
        </Card>
      ) : (
        <button className="card clickable" onClick={() => navigate('/saude/consultas?novo=1')}>
          <div className="row"><Cat icon="calendar" tone="teal" /><div className="grow"><div className="strong">Agendar uma consulta</div><div className="xsmall muted">Registre a data e receba lembrete.</div></div><Icon name="chevronRight" /></div>
        </button>
      )}

      <Disclaimer short />
    </div>
  );
}
