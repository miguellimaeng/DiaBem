/* Aula: cartões curtos → quiz → conclusão. */
import { useEffect, useState } from 'react';
import { useApp } from '@/app/AppContext';
import { back, navigate, ROUTES } from '@/app/router';
import { repo } from '@/database/repositories';
import { Button, Card, Empty, IconButton, ProgressBar } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { Illustration } from '@/components/Illustration';
import { getLesson, LESSONS } from './lessons.data';
import { nowISO } from '@/utils/date';
import { cx } from '@/utils/format';

export function LessonPage({ id }: { id: string }) {
  const { t, mode, toast } = useApp();
  const lesson = getLesson(id);
  const [i, setI] = useState(0); // índice: cartões, depois perguntas, depois fim
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);

  useEffect(() => {
    setI(0); setPicked(null); setScore(0);
    window.scrollTo({ top: 0 });
  }, [id]);

  if (!lesson) return <Card><Empty icon="book" title="Aula não encontrada" action={<Button onClick={() => navigate(ROUTES.learn)}>Ver aulas</Button>} /></Card>;

  const nCards = lesson.cards.length;
  const nQuiz = lesson.quiz.length;
  const total = nCards + nQuiz;
  const finished = i >= total;
  const inQuiz = i >= nCards && !finished;
  const card = lesson.cards[i];
  const q = inQuiz ? lesson.quiz[i - nCards] : null;

  async function advance() {
    const next = i + 1;
    setPicked(null);
    setI(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const prev = await repo.learningProgress.get(lesson!.id);
    if (next >= total) {
      await repo.learningProgress.put({ id: lesson!.id, moduleId: lesson!.id, lastCard: total, completedAt: prev?.completedAt ?? nowISO(), quizScore: score, updatedAt: nowISO() });
      toast(t('Aula concluída!', 'Missão cumprida!'));
    } else if (!prev?.completedAt) {
      await repo.learningProgress.put({ id: lesson!.id, moduleId: lesson!.id, lastCard: next, updatedAt: nowISO() });
    }
  }

  function choose(idx: number) {
    if (picked != null || !q) return;
    setPicked(idx);
    if (idx === q.correctIndex) setScore((s) => s + 1);
  }

  const nextLesson = LESSONS[(LESSONS.findIndex((l) => l.id === lesson.id) + 1) % LESSONS.length];
  const body = card ? (mode === 'child' && card.bodyChild ? card.bodyChild : card.body) : [];

  return (
    <article>
      <div className="row-between mb-3">
        <IconButton icon="x" label="Sair da aula" onClick={() => back(ROUTES.learn)} />
        <div className="grow" style={{ margin: '0 12px' }}><ProgressBar value={(Math.min(i, total) / total) * 100} label="Progresso da aula" /></div>
        <span className="xsmall muted strong">{Math.min(i + 1, total)}/{total}</span>
      </div>

      {!finished && i === 0 && (
        <div className="center mb-3" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <Illustration name={lesson.topic} size={96} />
          <h1 style={{ fontSize: 'var(--fs-xl)' }}>{t(lesson.title, lesson.titleChild)}</h1>
          <span className="xsmall muted">{lesson.minutes} min · {lesson.level}</span>
        </div>
      )}

      {card && (
        <Card>
          <h2 style={{ fontSize: 'var(--fs-lg)' }}>{card.title}</h2>
          <div className="lesson-body mt-3" aria-live="polite">{body.map((p, k) => <p key={k}>{p}</p>)}</div>
          {card.keyPoint && <div className="keypoint mt-3 row" style={{ gap: 8, alignItems: 'flex-start' }}><Icon name="sparkles" size={18} /><span>{card.keyPoint}</span></div>}
        </Card>
      )}

      {q && (
        <Card>
          <span className="badge violet">Pergunta {i - nCards + 1} de {nQuiz}</span>
          <h2 className="mt-3" style={{ fontSize: 'var(--fs-lg)' }}>{q.question}</h2>
          <div className="stack-sm mt-3" role="radiogroup" aria-label={q.question}>
            {q.options.map((o, k) => (
              <button key={k} role="radio" aria-checked={picked === k}
                className={cx('choice quiz-option', picked != null && k === q.correctIndex && 'correct', picked === k && k !== q.correctIndex && 'wrong')}
                onClick={() => choose(k)} disabled={picked != null && picked !== k && k !== q.correctIndex}>
                {picked != null && k === q.correctIndex && <Icon name="checkCircle" size={18} />}
                {o}
              </button>
            ))}
          </div>
          {picked != null && (
            <div className="notice neutral mt-3" role="status">
              <Icon name="info" size={18} />
              <div><b>{picked === q.correctIndex ? t('Isso mesmo!', 'Acertou!') : t('Quase!', 'Quase lá!')}</b> {q.explanation}</div>
            </div>
          )}
        </Card>
      )}

      {finished && (
        <Card className="center">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '10px 0' }}>
            <span className="cat lg tone-green"><Icon name="trophy" size={26} /></span>
            <h2>{t('Aula concluída', 'Missão cumprida!')}</h2>
            <p className="small muted">Você acertou {score} de {nQuiz} pergunta{nQuiz > 1 ? 's' : ''}. O importante é aprender — pode refazer quando quiser.</p>
          </div>
        </Card>
      )}

      <div className="mt-4 stack-sm">
        {!finished && <Button block disabled={inQuiz && picked == null} onClick={advance} icon={i === total - 1 ? 'check' : undefined}>{i === total - 1 ? 'Concluir' : inQuiz ? 'Próxima' : 'Continuar'}</Button>}
        {finished && (
          <>
            <Button block icon="bookOpen" onClick={() => navigate(`${ROUTES.learn}/${nextLesson.id}`)}>Próxima aula: {t(nextLesson.title, nextLesson.titleChild)}</Button>
            <Button block variant="ghost" onClick={() => navigate(ROUTES.learn)}>Voltar para Aprender</Button>
          </>
        )}
        {!finished && i > 0 && !inQuiz && <Button block variant="ghost" onClick={() => setI(i - 1)}>Voltar</Button>}
      </div>
    </article>
  );
}
