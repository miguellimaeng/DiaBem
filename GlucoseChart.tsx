/* Gráfico de linha da glicose com faixa configurada (se houver). SVG puro, acessível. */
import { useMemo, useRef, useState } from 'react';
import type { GlucoseRecord, GlucoseTargetRange, GlucoseUnit } from '@/types/models';
import { formatGlucose, rangeState } from '@/utils/glucose';
import { fmtDateTime, fmtTime, fmtDateShort } from '@/utils/date';

interface Props {
  records: GlucoseRecord[];
  range: GlucoseTargetRange | null;
  unit: GlucoseUnit;
  from: Date;
  to: Date;
  height?: number;
}

const W = 340;
const PAD = { l: 34, r: 10, t: 14, b: 26 };

export function GlucoseChart({ records, range, unit, from, to, height = 190 }: Props) {
  const [hover, setHover] = useState<number | null>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const H = height;
  const pts = useMemo(() => [...records].sort((a, b) => a.at.localeCompare(b.at)), [records]);

  const vals = pts.map((p) => p.valueMgdl);
  const lo = Math.min(...vals, range?.lowMgdl ?? Infinity);
  const hi = Math.max(...vals, range?.highMgdl ?? -Infinity);
  const yMin = Math.max(0, Math.floor((lo - 20) / 20) * 20);
  const yMax = Math.ceil((hi + 20) / 20) * 20;
  const t0 = from.getTime();
  const t1 = Math.max(to.getTime(), t0 + 1);
  const x = (iso: string) => PAD.l + ((new Date(iso).getTime() - t0) / (t1 - t0)) * (W - PAD.l - PAD.r);
  const y = (v: number) => PAD.t + (1 - (v - yMin) / (yMax - yMin || 1)) * (H - PAD.t - PAD.b);

  const ticksY = useMemo(() => {
    const step = (yMax - yMin) > 200 ? 100 : (yMax - yMin) > 100 ? 50 : 20;
    const out: number[] = [];
    for (let v = Math.ceil(yMin / step) * step; v <= yMax; v += step) out.push(v);
    return out;
  }, [yMin, yMax]);

  const spanDays = (t1 - t0) / 86400000;
  const ticksX = useMemo(() => {
    const n = 4;
    return Array.from({ length: n + 1 }, (_, i) => new Date(t0 + ((t1 - t0) * i) / n));
  }, [t0, t1]);

  const path = pts.map((p, i) => `${i ? 'L' : 'M'}${x(p.at).toFixed(1)},${y(p.valueMgdl).toFixed(1)}`).join(' ');
  const showLine = spanDays <= 2 || pts.length < 60;

  function onMove(clientX: number) {
    const el = wrap.current;
    if (!el || !pts.length) return;
    const rect = el.getBoundingClientRect();
    const sx = ((clientX - rect.left) / rect.width) * W;
    let best = 0, bd = Infinity;
    pts.forEach((p, i) => { const d = Math.abs(x(p.at) - sx); if (d < bd) { bd = d; best = i; } });
    setHover(best);
  }

  const desc = pts.length
    ? `Gráfico com ${pts.length} medições entre ${fmtDateShort(from)} e ${fmtDateShort(to)}.`
    : 'Sem medições no período.';

  const hp = hover != null ? pts[hover] : null;

  return (
    <div
      className="chart-wrap"
      ref={wrap}
      onPointerMove={(e) => onMove(e.clientX)}
      onPointerDown={(e) => onMove(e.clientX)}
      onPointerLeave={() => setHover(null)}
    >
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={desc}>
        {range && (
          <rect x={PAD.l} width={W - PAD.l - PAD.r} y={y(range.highMgdl)} height={Math.max(0, y(range.lowMgdl) - y(range.highMgdl))}
            fill="rgba(76,168,115,.10)" rx="4" />
        )}
        {ticksY.map((v) => (
          <g key={v}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} stroke="#edf1f5" />
            <text x={PAD.l - 6} y={y(v) + 3.5} textAnchor="end" fontSize="9.5" fill="#8a97a8">{formatGlucose(v, unit)}</text>
          </g>
        ))}
        {ticksX.map((d, i) => (
          <text key={i} x={PAD.l + ((W - PAD.l - PAD.r) * i) / 4} y={H - 8} textAnchor={i === 0 ? 'start' : i === 4 ? 'end' : 'middle'} fontSize="9.5" fill="#8a97a8">
            {spanDays <= 1.1 ? fmtTime(d.toISOString()) : fmtDateShort(d)}
          </text>
        ))}
        {showLine && pts.length > 1 && <path d={path} fill="none" style={{ stroke: 'var(--primary)' }} strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" opacity=".85" />}
        {pts.map((p, i) => {
          const st = rangeState(p.valueMgdl, range);
          const fill = st === 'unset' || st === 'in' ? 'var(--primary)' : 'var(--amber)';
          return <circle key={p.id} cx={x(p.at)} cy={y(p.valueMgdl)} r={hover === i ? 5.5 : pts.length > 80 ? 2.2 : 3.4} style={{ fill }} stroke="#fff" strokeWidth={hover === i ? 2 : 1} />;
        })}
        {hp && <line x1={x(hp.at)} x2={x(hp.at)} y1={PAD.t} y2={H - PAD.b} stroke="#c7d2e3" strokeDasharray="3 3" />}
      </svg>
      {hp && (
        <div className="chart-tip" style={{ left: `${(x(hp.at) / W) * 100}%`, top: `${(y(hp.valueMgdl) / H) * 100}%` }}>
          {formatGlucose(hp.valueMgdl, unit)} {unit} · {fmtDateTime(hp.at)}
        </div>
      )}
    </div>
  );
}

/** Barra de distribuição abaixo / dentro / acima da faixa. */
export function DistributionBar({ below, inRange, above }: { below: number; inRange: number; above: number }) {
  return (
    <>
      <div className="dist" role="img" aria-label={`Abaixo ${Math.round(below)}%, dentro ${Math.round(inRange)}%, acima ${Math.round(above)}%`}>
        <span style={{ width: `${below}%`, background: '#7aa0ee' }} />
        <span style={{ width: `${inRange}%`, background: 'var(--green)' }} />
        <span style={{ width: `${above}%`, background: 'var(--amber)' }} />
      </div>
      <div className="legend">
        <span><i style={{ background: '#7aa0ee' }} />Abaixo {Math.round(below)}%</span>
        <span><i style={{ background: 'var(--green)' }} />Dentro {Math.round(inRange)}%</span>
        <span><i style={{ background: 'var(--amber)' }} />Acima {Math.round(above)}%</span>
      </div>
    </>
  );
}
