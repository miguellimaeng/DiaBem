/* Aprender — "O que posso aprender hoje?" */
import { useState } from 'react';
import { useApp } from '@/app/AppContext';
import { useData } from '@/app/useData';
import { navigate, ROUTES } from '@/app/router';
import { repo } from '@/database/repositories';
import { Card, PageHead, Pills, Ring, Section } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { Illustration } from '@/components/Illustration';
import { LESSONS, lessonOfTheDay } from './lessons.data';
import { evaluateAchievements } from './achievements';
import type { LearningModule } from '@/types/models';

type Level = 'all' | LearningModule['level'];

export function LearnPage() {
  const { t, mode } = useApp();
  const [level, setLevel] = useState<Level>('all');
  const { data } = useData(async () => {
    const [progress, achievements] = await Promise.all([repo.learningProgress.all(), evaluateAchievements()]);
    return { progress: new Map(progress.map((p) => [p.id, p])), achievements };
  }, [], ['learningProgress', 'achievements', 'glucose', 'meals', 'activities', 'exams', 'emergency']);

  const done = LESSONS.filter((l) => data?.progress.get(l.id)?.completedAt).length;
  const today = lessonOfTheDay(new Set(LESSONS.filter((l) => data?.progress.get(l.id)?.completedAt).map((l) => l.id)));
  const list = LESSONS.filter((l) => level === 'all' || l.level === level);
  const unlocked = data?.achievements.filter((a) => a.unlockedAt).length ?? 0;

  return (
    <div>
      <PageHead title="Aprender" subtitle={t('O que posso aprender hoje?', 'Aulas curtinhas e missões')} />

      <Card>
        <div className="row" style={{ gap: 14 }}>
          <Ring value={(done / LESSONS.length) * 100} size={64}>{done}</Ring>
          <div className="grow">
            <div className="strong">{done} de {LESSONS.length} aulas concluídas</div>
            <div className="xsmall muted">{unlocked} conquista{unlocked === 1 ? '' : 's'} desbloqueada{unlocked === 1 ? '' : 's'}</div>
          </div>
        </div>
      </Card>

      <Section title={t('Missão de hoje', 'Missão do dia')} />
      <button className="card clickable" onClick={() => navigate(`${ROUTES.learn}/${today.id}`)} style={{ borderColor: 'var(--primary-soft)', borderWidth: 2 }}>
        <div className="media-row">
          <Illustration name={today.topic} size={72} />
          <div>
            <span className="badge blue"><Icon name="sparkles" size={11} /> Missão</span>
            <div className="title mt-2">{t(today.title, today.titleChild)}</div>
            <div className="sub">{today.minutes} min · {today.summary}</div>
          </div>
        </div>
      </button>

      {mode !== 'easy' && data && (
        <>
          <Section title="Conquistas" />
          <div className="grid-3">
            {data.achievements.map((a) => (
              <div key={a.def.id} className={`achievement ${a.unlockedAt ? '' : 'locked'}`} title={a.def.desc} aria-label={`${a.def.title}: ${a.unlockedAt ? 'desbloqueada' : 'bloqueada'}. ${a.def.desc}`}>
                <span className={`cat tone-${a.def.tone}`}><Icon name={a.def.icon} /></span>
                <span className="name">{t(a.def.title, a.def.titleChild)}</span>
              </div>
            ))}
          </div>
          <p className="xsmall muted mt-2">Conquistas vêm de registrar, aprender e se organizar — nunca dos valores da glicose.</p>
        </>
      )}

      <Section title="Todas as aulas" />
      <Pills label="Nível" value={level} onChange={setLevel} options={[
        { value: 'all', label: 'Todas' }, { value: 'básico', label: 'Básico' }, { value: 'hábitos', label: 'Hábitos' }, { value: 'cuidados', label: 'Cuidados' }, { value: 'rotina', label: 'Rotina' },
      ]} />
      <div className="stack mt-3">
        {list.map((l) => {
          const p = data?.progress.get(l.id);
          return (
            <button key={l.id} className="card clickable tight" onClick={() => navigate(`${ROUTES.learn}/${l.id}`)}>
              <div className="media-row" style={{ gridTemplateColumns: '56px 1fr auto' }}>
                <Illustration name={l.topic} size={56} />
                <div>
                  <div className="title">{t(l.title, l.titleChild)}</div>
                  <div className="sub">{l.minutes} min · {l.level}</div>
                </div>
                {p?.completedAt ? <span className="cat sm tone-green" aria-label="Concluída"><Icon name="check" size={16} /></span> : <Icon name="chevronRight" size={18} style={{ color: 'var(--muted)' }} />}
              </div>
            </button>
          );
        })}
      </div>
      <p className="disclaimer">Conteúdo educativo geral. Não substitui orientação individual da sua equipe de saúde.</p>
    </div>
  );
}
