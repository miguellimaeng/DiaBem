export const pct = (n: number | null | undefined) => (n == null ? '—' : `${Math.round(n)}%`);
export const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
export function bytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1).replace('.', ',')} MB`;
}
export const cx = (...xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join(' ');
