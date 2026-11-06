/* Meu Dia — linha do tempo de tudo que foi registrado. */
import { useState } from 'react';
import { useApp } from '@/app/AppContext';
import { useData } from '@/app/useData';
import { Button, Card, DemoTag, Empty, IconButton, PageHead } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { addDays, endOfDay, fmtDayLabel, fmtTime, isSameDay, startOfDay } from '@/utils/date';
import { loadTimeline, routineProgress, ROUTINE_KINDS } from './timeline';
import { KIND_META } from '@/config/categories';

export function DayPage() {
  const { settings, openQuick, t } = useApp();
  const [day, setDay] = useState(startOfDay());
  const isToday = isSameDay(day, new Date());
  const { data: items } = useData(() => loadTimeline(startOfDay(day), endOfDay(day), settings.glucoseUnit), [day.getTime(), settings.glucoseUnit]);
  const routine = items ? routineProgress(items) : null;

  return (
    <div>
      <PageHead title={t('Meu Dia', 'Meu dia')} subtitle={t('Tudo o que você registrou, em ordem.', 'Tudo o que você fez hoje!')} />

      <Card className="tight" as="div">
        <div className="row-between">
          <IconButton icon="chevronLeft" label="Dia anterior" variant="ghost" onClick={() => setDay(addDays(day, -1))} />
          <div className="center">
            <div className="strong">{fmtDayLabel(day)}</div>
            <div className="xsmall muted">{day.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
          </div>
          <IconButton icon="chevronRight" label="Próximo dia" variant="ghost" disabled={isToday} style={{ opacity: isToday ? 0.3 : 1 }} onClick={() => setDay(addDays(day, 1))} />
        </div>
      </Card>

      {routine && (
        <Card className="tight" as="div" aria-label="Rotina do dia">
          <div className="row-between mb-2">
            <span className="small strong">{t('Rotina registrada', 'Missões do dia')}</span>
            <span className="xsmall muted">{routine.done}/{routine.total}</span>
          </div>
          <div className="row wrap" style={{ gap: 6 }}>
            {ROUTINE_KINDS.map((r) => {
              const done = !routine.missing.some((m) => m.kind === r.kind);
              return (
                <button key={r.kind} className={`badge ${done ? 'green' : 'gray'}`} style={{ border: 0, minHeight: 30, cursor: done ? 'default' : 'pointer' }}
                  onClick={() => !done && openQuick(r.kind)} aria-label={`${r.label}: ${done ? 'registrado' : 'registrar agora'}`}>
                  <Icon name={done ? 'checkCircle' : 'plus'} size={13} /> {r.label}
                </button>
              );
            })}
          </div>
        </Card>
      )}

      <div className="mt-4">
        {items && items.length === 0 && (
          <Card>
            <Empty icon="calendarDay" title={isToday ? 'Seu dia ainda está em branco' : 'Nenhum registro neste dia'}
              text={isToday ? 'Toque em Registrar para começar. Cada registro aparece aqui.' : 'Tudo bem: nenhum dia precisa ser perfeito.'}
              action={isToday ? <Button icon="plus" onClick={() => openQuick('glucose')}>Registrar glicose</Button> : undefined} />
          </Card>
        )}
        {items && items.length > 0 && (
          <ol className="timeline" aria-label={`Linha do tempo de ${fmtDayLabel(day)}`} style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {items.map((it) => (
              <li key={it.kind + it.id} className="tl-item">
                <time className="tl-time" dateTime={it.at}>{fmtTime(it.at)}</time>
                <span className={`tl-dot dot-${it.tone}`} aria-hidden="true" />
                <button className="tl-card" onClick={() => openQuick(it.kind, { editId: it.id })} aria-label={`${it.title}, ${it.sub}, às ${fmtTime(it.at)}. Toque para editar.`} style={{ cursor: 'pointer', font: 'inherit' }}>
                  <span className={`cat sm tone-${it.tone}`}><Icon name={it.icon} size={16} /></span>
                  <div className="grow" style={{ minWidth: 0 }}>
                    <div className="title row" style={{ gap: 6 }}>{it.title}{it.isDemo && <DemoTag />}</div>
                    <div className="sub truncate">{it.sub}</div>
                  </div>
                  <Icon name="chevronRight" size={16} style={{ color: 'var(--muted)' }} />
                </button>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className="grid-2 mt-4">
        <Button variant="soft" icon="plus" onClick={() => openQuick('event')}>Adicionar evento</Button>
        <Button variant="ghost" icon={KIND_META.mood.icon} onClick={() => openQuick('mood')}>{t('Como estou', 'Como me sinto')}</Button>
      </div>
    </div>
  );
}
