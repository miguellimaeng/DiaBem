/* Exportação de dados (portabilidade — LGPD). */
import { idb, ALL_STORES } from '@/database/db';
import { APP_CONFIG } from '@/config/app.config';

async function blobToDataURL(b: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result));
    fr.onerror = () => reject(fr.error);
    fr.readAsDataURL(b);
  });
}

async function serialize(value: unknown): Promise<unknown> {
  if (value instanceof Blob) return { __blob: true, type: value.type, dataUrl: await blobToDataURL(value) };
  if (Array.isArray(value)) return Promise.all(value.map(serialize));
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = await serialize(v);
    return out;
  }
  return value;
}

export async function exportAllAsJSON(includeFiles = true): Promise<Blob> {
  const data: Record<string, unknown> = {};
  for (const store of ALL_STORES) {
    const rows = await idb.getAll(store);
    data[store] = includeFiles ? await serialize(rows) : JSON.parse(JSON.stringify(rows, (_k, v) => (v instanceof Blob ? '[arquivo omitido]' : v)));
  }
  const payload = { app: APP_CONFIG.name, schema: 1, exportedAt: new Date().toISOString(), data };
  return new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
}

export function toCSV(rows: Record<string, unknown>[], columns: { key: string; label: string }[]): string {
  const esc = (v: unknown) => {
    const s = v == null ? '' : String(v);
    return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  // Ponto e vírgula: padrão do Excel em pt-BR.
  return [columns.map((c) => esc(c.label)).join(';'), ...rows.map((r) => columns.map((c) => esc(r[c.key])).join(';'))].join('\n');
}

export function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
