/** ID único, ordenável no tempo, sem dependências. */
export function uid(prefix = ''): string {
  const t = Date.now().toString(36);
  const r = (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2))
    .replace(/-/g, '')
    .slice(0, 12);
  return `${prefix}${t}${r}`;
}
