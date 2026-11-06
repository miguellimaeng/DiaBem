/* Estrutura comum dos formulários de registro (salvar / excluir / data e hora). */
import { useState, type ReactNode } from 'react';
import { Button, Sheet } from './index';
import { fromLocalInputs, toLocalDateInput, toLocalTimeInput } from '@/utils/date';

export function useWhen(initialISO?: string) {
  const d = initialISO ? new Date(initialISO) : new Date();
  const [date, setDate] = useState(toLocalDateInput(d));
  const [time, setTime] = useState(toLocalTimeInput(d));
  return { date, time, setDate, setTime, iso: () => fromLocalInputs(date, time), reset(iso: string) { const x = new Date(iso); setDate(toLocalDateInput(x)); setTime(toLocalTimeInput(x)); } };
}

export function RecordSheet({ title, onClose, onSave, onDelete, canSave = true, saveLabel = 'Salvar', children, footer }: {
  title: string; onClose: () => void; onSave?: () => Promise<void> | void; onDelete?: () => Promise<void> | void;
  canSave?: boolean; saveLabel?: string; children: ReactNode; footer?: ReactNode;
}) {
  const [busy, setBusy] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  async function run(fn?: () => Promise<void> | void) {
    if (!fn) return;
    setBusy(true);
    try { await fn(); } finally { setBusy(false); }
  }
  return (
    <Sheet open title={title} onClose={onClose}
      footer={footer ?? (
        <>
          {onDelete && (confirmDel
            ? <Button variant="danger" icon="trash" disabled={busy} onClick={() => run(onDelete)}>Confirmar</Button>
            : <Button variant="ghost" icon="trash" onClick={() => setConfirmDel(true)} aria-label="Excluir registro">Excluir</Button>)}
          {onSave && <Button disabled={!canSave || busy} onClick={() => run(onSave)} icon="check">{saveLabel}</Button>}
        </>
      )}
    >
      <div className="stack">{children}</div>
    </Sheet>
  );
}
