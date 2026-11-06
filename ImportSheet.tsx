/* Importar arquivo de configuração inicial ou backup. */
import { useState } from 'react';
import { Button, Notice, Sheet } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { applyImport, describe, readImportFile, type ImportSummary } from '@/services/importData';

export function ImportSheet({ onClose, onDone }: { onClose: () => void; onDone: (summary: ImportSummary, raw: unknown) => void | Promise<void> }) {
  const [raw, setRaw] = useState<unknown>(null);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function pick(f?: File) {
    if (!f) return;
    setError(''); setSummary(null);
    try { const d = await readImportFile(f); setSummary(describe(d)); setRaw(d); }
    catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível ler o arquivo.'); }
  }

  async function confirm() {
    if (!raw) return;
    setBusy(true);
    try { const s = await applyImport(raw); await onDone(s, raw); }
    catch (e) { setError(e instanceof Error ? e.message : 'Falha ao importar.'); setBusy(false); }
  }

  return (
    <Sheet open title="Importar dados" onClose={onClose}
      footer={summary ? <><Button variant="ghost" onClick={() => { setSummary(null); setRaw(null); }}>Trocar arquivo</Button><Button icon="check" disabled={busy} onClick={confirm}>{busy ? 'Importando…' : 'Importar'}</Button></> : undefined}>
      <div className="stack">
        {!summary && (
          <>
            <p className="small">Escolha um <b>arquivo de configuração</b> do DiaBem (preparado por um familiar ou profissional) ou um <b>backup</b> exportado pelo próprio app.</p>
            <label className="upload">
              <Icon name="upload" size={28} />
              <strong className="small">Escolher arquivo .json</strong>
              <span className="xsmall muted">O arquivo é lido só neste aparelho.</span>
              <input type="file" accept="application/json,.json" onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ''; }} />
            </label>
          </>
        )}
        {error && <Notice tone="warm" icon="alert">{error}</Notice>}
        {summary && (
          <>
            <div className="card tight flat" style={{ marginTop: 0 }}>
              <div className="small muted">{summary.kind === 'setup' ? 'Configuração inicial' : 'Backup completo'}</div>
              {summary.name && <div className="strong" style={{ fontSize: 'var(--fs-lg)' }}>{summary.name}</div>}
              <ul className="small" style={{ margin: '8px 0 0', paddingLeft: 18 }}>
                {Object.entries(summary.counts).filter(([, n]) => n > 0).map(([k, n]) => <li key={k}>{k}: {n}</li>)}
              </ul>
            </div>
            <Notice tone="info" icon="lock">São dados de saúde. Importe somente com autorização da pessoa. Nada existente será apagado.</Notice>
            {summary.kind === 'setup' && <Notice tone="neutral">Informações marcadas como “a confirmar” continuam assim até serem conferidas na receita ou no laudo original.</Notice>}
          </>
        )}
      </div>
    </Sheet>
  );
}
