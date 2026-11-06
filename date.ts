/* Datas no fuso do aparelho. Armazenamos ISO (UTC) e exibimos localmente. */
const LOCALE = 'pt-BR';

export const nowISO = () => new Date().toISOString();

export function startOfDay(d = new Date()): Date {
  const x = new Date(d); x.setHours(0, 0, 0, 0); return x;
}
export function endOfDay(d = new Date()): Date {
  const x = new Date(d); x.setHours(23, 59, 59, 999); return x;
}
export function addDays(d: Date, n: number): Date {
  const x = new Date(d); x.setDate(x.getDate() + n); return x;
}
export function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** "2026-11-06" no fuso local. */
export function toLocalDateInput(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
/** "08:10" no fuso local. */
export function toLocalTimeInput(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}`;
}
/** Junta data e hora locais em ISO. */
export function fromLocalInputs(date: string, time: string): string {
  const [y, m, dd] = date.split('-').map(Number);
  const [hh, mm] = (time || '00:00').split(':').map(Number);
  return new Date(y, (m || 1) - 1, dd || 1, hh || 0, mm || 0).toISOString();
}
/** Converte "AAAA-MM-DD" para Date local ao meio-dia (evita bug de fuso). */
export function parseLocalDate(date: string): Date {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
}

export const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit' });

export function fmtDayLabel(d: Date): string {
  const today = new Date();
  if (isSameDay(d, today)) return 'Hoje';
  if (isSameDay(d, addDays(today, -1))) return 'Ontem';
  if (isSameDay(d, addDays(today, 1))) return 'Amanhã';
  const s = d.toLocaleDateString(LOCALE, { weekday: 'long', day: 'numeric', month: 'long' });
  return s.charAt(0).toUpperCase() + s.slice(1);
}
export const fmtDateShort = (d: Date | string) =>
  new Date(d).toLocaleDateString(LOCALE, { day: '2-digit', month: 'short' }).replace('.', '');
export const fmtDateLong = (d: Date | string) =>
  new Date(d).toLocaleDateString(LOCALE, { day: 'numeric', month: 'long', year: 'numeric' });
export const fmtDateTime = (iso: string) =>
  `${fmtDateShort(iso)} • ${fmtTime(iso)}`;
export const fmtWeekday = (d: Date | string) =>
  new Date(d).toLocaleDateString(LOCALE, { weekday: 'short' }).replace('.', '');
export const fmtMonthShort = (d: Date | string) =>
  new Date(d).toLocaleDateString(LOCALE, { month: 'short' }).replace('.', '').toUpperCase();

export function greeting(d = new Date()): string {
  const h = d.getHours();
  if (h < 5) return 'Boa noite';
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

export function relativeFromNow(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.round(h / 24);
  return d === 1 ? 'ontem' : `há ${d} dias`;
}

export function daysUntil(iso: string): number {
  return Math.round((startOfDay(new Date(iso)).getTime() - startOfDay().getTime()) / 86400000);
}
