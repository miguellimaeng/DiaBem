/* Gráficos simples reutilizáveis: barras por dia e linha de evolução (exames). */
import { fmtDateShort } from '@/utils/date';

export function DayBars({ data, color = 'var(--primary)', label }: { data: { label: string; value: number }[]; color?: string; label: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const W = 320, H = 110, bw = W / data.length;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} style={{ width: '100%', height: 'auto', display: 'block' }}>
      {data.map((d, i) => {
        const h = (d.value / max) * (H - 30);
        return (
          <g key={i}>
            <rect x={i * bw + bw * 0.2} y={H - 18 - h} width={bw * 0.6} height={Math.max(h, d.value ? 3 : 0)} rx={Math.min(6, bw * 0.2)} fill={color} opacity={d.value ? 0.9 : 0.15} />
            {d.value > 0 && <text x={i * bw + bw / 2} y={H - 22 - h} textAnchor="middle" fontSize="9" fill="#718096">{d.value}</text>}
            <text x={i * bw + bw / 2} y={H - 4} textAnchor="middle" fontSize="9" fill="#8a97a8">{d.label}</text>
            {!d.value && <rect x={i * bw + bw * 0.2} y={H - 21} width={bw * 0.6} height={3} rx={1.5} fill="#e2e8f0" />}
          </g>
        );
      })}
    </svg>
  );
}

export function TrendLine({ points, unit, color = 'var(--violet)' }: { points: { date: string; value: number }[]; unit: string; color?: string }) {
  const W = 320, H = 120, P = 24;
  const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date));
  const vs = sorted.map((p) => p.value);
  const min = Math.min(...vs), max = Math.max(...vs);
  const pad = (max - min) * 0.2 || Math.abs(max) * 0.1 || 1;
  const y = (v: number) => P / 2 + (1 - (v - (min - pad)) / (max - min + 2 * pad)) * (H - P - 8);
  const x = (i: number) => P + (sorted.length === 1 ? (W - 2 * P) / 2 : (i / (sorted.length - 1)) * (W - 2 * P));
  // no máximo ~5 rótulos de data para não sobrepor
  const step = Math.max(1, Math.ceil(sorted.length / 5));
  const showLabel = (i: number) => i === sorted.length - 1 || (i % step === 0 && sorted.length - 1 - i >= step / 2);
  const d = sorted.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p.value)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Evolução com ${sorted.length} valores registrados (${unit}).`} style={{ width: '100%', height: 'auto', display: 'block' }}>
      <path d={d} fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      {sorted.map((p, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(p.value)} r="4" fill="#fff" stroke={color} strokeWidth="2.4" />
          <text x={x(i)} y={y(p.value) - 9} textAnchor="middle" fontSize="10" fontWeight="700" fill="#405066">{String(p.value).replace('.', ',')}</text>
          {showLabel(i) && <text x={x(i)} y={H - 2} textAnchor={sorted.length > 1 && i === 0 ? 'start' : sorted.length > 1 && i === sorted.length - 1 ? 'end' : 'middle'} fontSize="9" fill="#8a97a8">{fmtDateShort(p.date + 'T12:00:00')}</text>}
        </g>
      ))}
    </svg>
  );
}
