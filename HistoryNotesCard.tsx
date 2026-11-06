/* Histórico informado (relatos e transcrições), separado dos registros e laudos. */
import { useApp } from '@/app/AppContext';
import { Card } from '@/components/ui';
import { EVIDENCE_META } from '@/config/categories';
import { Icon } from '@/components/Icon';

export function HistoryNotesCard({ printable }: { printable?: boolean }) {
  const { profile, saveProfile, toast } = useApp();
  const notes = profile?.historyNotes ?? [];
  if (!notes.length) return null;
  return (
    <Card title="Histórico informado">
      <p className="xsmall muted mb-3">Informações trazidas de resumos e relatos. Não são laudos nem registros feitos no app.</p>
      <div className="list">
        {notes.map((n) => (
          <div key={n.id} className="list-item" style={{ alignItems: 'flex-start' }}>
            <div className="grow">
              <div className="row wrap" style={{ gap: 6 }}>
                <span className="title small">{n.title}</span>
                <span className={`badge ${EVIDENCE_META[n.evidence].tone}`}>{EVIDENCE_META[n.evidence].label}</span>
              </div>
              {n.when && <div className="xsmall muted">{n.when}</div>}
              <div className="small mt-2">{n.text}</div>
            </div>
            {!printable && (
              <button className="icon-btn ghost no-print" aria-label={`Remover ${n.title}`} title="Remover" onClick={async () => {
                await saveProfile({ historyNotes: notes.filter((x) => x.id !== n.id) }); toast('Item removido do histórico');
              }}><Icon name="trash" size={17} /></button>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
