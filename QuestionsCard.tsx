/* "Perguntas para meu médico" — anotadas ao longo das semanas. */
import { useState } from 'react';
import { useData } from '@/app/useData';
import { repo } from '@/database/repositories';
import { Card, DemoTag } from '@/components/ui';
import { Icon } from '@/components/Icon';

export function QuestionsCard({ compact }: { compact?: boolean }) {
  const { data } = useData(() => repo.questions.all(), [], ['questions']);
  const [text, setText] = useState('');
  const list = (data ?? []).sort((a, b) => Number(a.done) - Number(b.done) || a.createdAt.localeCompare(b.createdAt));

  async function add() {
    const t = text.trim();
    if (!t) return;
    await repo.questions.add({ text: t, done: false });
    setText('');
  }

  return (
    <Card>
      <form className="row" onSubmit={(e) => { e.preventDefault(); add(); }}>
        <input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Ex.: Tenho sentido muita fome à noite." aria-label="Nova pergunta para o médico" />
        <button className="icon-btn soft" type="submit" aria-label="Adicionar pergunta" disabled={!text.trim()}><Icon name="plus" /></button>
      </form>
      {list.length > 0 && (
        <ul className="list mt-2" style={{ listStyle: 'none', padding: 0, margin: '8px 0 0' }}>
          {(compact ? list.filter((q) => !q.done) : list).map((q) => (
            <li key={q.id} className="list-item">
              <button className="icon-btn ghost" aria-label={q.done ? 'Marcar como pendente' : 'Marcar como respondida'} onClick={() => repo.questions.update(q.id, { done: !q.done })}
                style={{ color: q.done ? 'var(--green)' : 'var(--muted)' }}>
                <Icon name={q.done ? 'checkCircle' : 'circle'} />
              </button>
              <span className="grow small" style={{ textDecoration: q.done ? 'line-through' : undefined, color: q.done ? 'var(--muted)' : undefined }}>
                {q.text} {q.isDemo && <DemoTag />}
              </span>
              <button className="icon-btn ghost" aria-label="Excluir pergunta" onClick={() => repo.questions.remove(q.id)}><Icon name="trash" size={17} /></button>
            </li>
          ))}
        </ul>
      )}
      {!list.length && <p className="xsmall muted mt-2">Anote dúvidas assim que surgirem. Elas entram no resumo da consulta.</p>}
    </Card>
  );
}
