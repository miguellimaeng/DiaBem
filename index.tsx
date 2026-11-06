/* =========================================================
   Componentes básicos do design system.
   ========================================================= */
import { useEffect, useId, useRef, type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode } from 'react';
import { Icon, type IconName } from '../Icon';
import { cx } from '@/utils/format';
import type { Tone } from '@/types/models';
import { APP_CONFIG } from '@/config/app.config';

/* ---------- Layout ---------- */
export function PageHead({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <header className="page-head row-between">
      <div className="grow">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}

export function Section({ title, action, onAction, id }: { title: string; action?: string; onAction?: () => void; id?: string }) {
  return (
    <div className="section">
      <h2 id={id}>{title}</h2>
      {action && onAction && <button className="link" onClick={onAction}>{action}</button>}
    </div>
  );
}

export function Card({ children, className, title, action, onAction, as: As = 'section', ...rest }: {
  children: ReactNode; className?: string; title?: string; action?: string; onAction?: () => void; as?: 'section' | 'div' | 'article';
} & HTMLAttributes<HTMLElement>) {
  return (
    <As className={cx('card', className)} {...rest}>
      {title && (
        <div className="card-head">
          <h3>{title}</h3>
          {action && onAction && <button className="btn btn-sm btn-soft" onClick={onAction}>{action}</button>}
        </div>
      )}
      {children}
    </As>
  );
}

/* ---------- Botões ---------- */
type BtnVariant = 'primary' | 'soft' | 'ghost' | 'danger';
export function Button({ variant = 'primary', icon, block, small, children, className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: BtnVariant; icon?: IconName; block?: boolean; small?: boolean;
}) {
  return (
    <button className={cx('btn', `btn-${variant}`, block && 'btn-block', small && 'btn-sm', className)} {...rest}>
      {icon && <Icon name={icon} size={small ? 16 : 18} />}
      {children}
    </button>
  );
}

export function IconButton({ icon, label, variant, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { icon: IconName; label: string; variant?: 'ghost' | 'soft' | 'danger' }) {
  return (
    <button className={cx('icon-btn', variant)} aria-label={label} title={label} {...rest}>
      <Icon name={icon} size={20} />
    </button>
  );
}

/* ---------- Ícone de categoria ---------- */
export function Cat({ icon, tone, size }: { icon: IconName; tone: Tone; size?: 'sm' | 'lg' }) {
  return (
    <span className={cx('cat', size, `tone-${tone}`)} aria-hidden="true">
      <Icon name={icon} size={size === 'lg' ? 24 : size === 'sm' ? 16 : 19} />
    </span>
  );
}

/* ---------- Estatística ---------- */
export function Stat({ icon, tone, value, unit, label }: { icon?: IconName; tone?: Tone; value: ReactNode; unit?: string; label: string }) {
  return (
    <div className="stat">
      {icon && tone && <Cat icon={icon} tone={tone} size="sm" />}
      <div className="stat-value">{value}{unit && <small>{unit}</small>}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

/* ---------- Seletores ---------- */
export function Pills<T extends string>({ options, value, onChange, label }: {
  options: { value: T; label: string }[]; value: T; onChange: (v: T) => void; label: string;
}) {
  return (
    <div className="pills" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" className="pill" aria-pressed={o.value === value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Segmented<T extends string>({ options, value, onChange, label }: {
  options: { value: T; label: string }[]; value: T; onChange: (v: T) => void; label: string;
}) {
  return (
    <div className="segmented" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={o.value === value} onClick={() => onChange(o.value)}>{o.label}</button>
      ))}
    </div>
  );
}

export function Choices<T extends string>({ options, value, onChange, label, cols = 2, multi }: {
  options: { value: T; label: string; icon?: IconName; tone?: Tone }[];
  value: T | T[]; onChange: (v: T) => void; label: string; cols?: 2 | 3; multi?: boolean;
}) {
  const sel = (v: T) => (Array.isArray(value) ? value.includes(v) : value === v);
  return (
    <div className={cx('choices', cols === 3 && 'cols-3')} role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" className={cx('choice', o.icon && cols === 3 && 'center')} aria-pressed={sel(o.value)} onClick={() => onChange(o.value)}>
          {o.icon && <Cat icon={o.icon} tone={o.tone ?? 'blue'} size="sm" />}
          <span>{o.label}</span>
          {multi && sel(o.value) && <Icon name="check" size={16} style={{ marginLeft: 'auto' }} />}
        </button>
      ))}
    </div>
  );
}

/* ---------- Campos ---------- */
export function Field({ label, hint, children, htmlFor }: { label: string; hint?: string; children: ReactNode; htmlFor?: string }) {
  return (
    <div className="field">
      {htmlFor ? <label htmlFor={htmlFor}>{label}</label> : <span className="field-label">{label}</span>}
      {children}
      {hint && <span className="hint">{hint}</span>}
    </div>
  );
}

export function TextField({ label, hint, value, onChange, type = 'text', placeholder, multiline, inputMode, ...rest }: {
  label: string; hint?: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; multiline?: boolean;
  inputMode?: HTMLAttributes<HTMLInputElement>['inputMode']; min?: number | string; max?: number | string; step?: number | string; autoFocus?: boolean; required?: boolean;
}) {
  const id = useId();
  return (
    <Field label={label} hint={hint} htmlFor={id}>
      {multiline ? (
        <textarea id={id} className="textarea" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input id={id} className="input" type={type} value={value} placeholder={placeholder} inputMode={inputMode} onChange={(e) => onChange(e.target.value)} {...rest} />
      )}
    </Field>
  );
}

export function SelectField<T extends string>({ label, value, onChange, options }: { label: string; value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  const id = useId();
  return (
    <Field label={label} htmlFor={id}>
      <select id={id} className="select" value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </Field>
  );
}

export function Switch({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  const id = useId();
  return (
    <div className="switch">
      <label htmlFor={id} className="grow">
        <div className="strong small">{label}</div>
        {hint && <div className="xsmall muted">{hint}</div>}
      </label>
      <input id={id} type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </div>
  );
}

export function DateTimeFields({ date, time, onDate, onTime }: { date: string; time: string; onDate: (v: string) => void; onTime: (v: string) => void }) {
  return (
    <div className="input-row">
      <TextField label="Data" type="date" value={date} onChange={onDate} />
      <TextField label="Hora" type="time" value={time} onChange={onTime} />
    </div>
  );
}

/* ---------- Folha inferior (modal acessível) ---------- */
export function Sheet({ open, title, onClose, children, footer }: { open: boolean; title: string; onClose: () => void; children: ReactNode; footer?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    setTimeout(() => ref.current?.querySelector<HTMLElement>('input,select,textarea,button:not([data-close])')?.focus(), 30);
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; prev?.focus?.(); };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="sheet-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby={titleId} ref={ref}>
        <div className="sheet-grip" aria-hidden="true" />
        <div className="sheet-head">
          <h2 id={titleId}>{title}</h2>
          <button className="icon-btn" data-close aria-label="Fechar" onClick={onClose}><Icon name="x" /></button>
        </div>
        {children}
        {footer && <div className="sheet-foot">{footer}</div>}
      </div>
    </div>
  );
}

export function Steps({ total, current, labels }: { total: number; current: number; labels?: string[] }) {
  return (
    <>
      <div className="steps" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={current + 1} aria-label={`Passo ${current + 1} de ${total}`}>
        {Array.from({ length: total }, (_, i) => <span key={i} className={i <= current ? 'on' : ''} />)}
      </div>
      {labels && <div className="step-title">Passo {current + 1} de {total} · {labels[current]}</div>}
    </>
  );
}

/* ---------- Estados ---------- */
export function Empty({ icon, tone = 'blue', title, text, action }: { icon: IconName; tone?: Tone; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="empty">
      <Cat icon={icon} tone={tone} size="lg" />
      <strong>{title}</strong>
      {text && <p className="small">{text}</p>}
      {action}
    </div>
  );
}

export function Notice({ tone = 'info', icon = 'info', children }: { tone?: 'info' | 'warm' | 'neutral'; icon?: IconName; children: ReactNode }) {
  return <div className={cx('notice', tone)} role="note"><Icon name={icon} size={18} /><div>{children}</div></div>;
}

export function DemoTag() {
  return <span className="demo-tag" title="Dado de demonstração, não é um registro real">Demo</span>;
}

export function Disclaimer({ short }: { short?: boolean }) {
  return (
    <p className="disclaimer">
      {short ? 'O DiaBem organiza registros e ensina — não diagnostica nem substitui sua equipe de saúde.' : APP_CONFIG.medicalDisclaimer}
    </p>
  );
}

export function ProgressBar({ value, label }: { value: number; label: string }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="progress" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(v)}>
      <span style={{ width: `${v}%` }} />
    </div>
  );
}

export function Ring({ value, size = 56, stroke = 6, color = 'var(--primary)', children }: { value: number; size?: number; stroke?: number; color?: string; children?: ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#edf1f5" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - v / 100)} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </svg>
      <span>{children}</span>
    </div>
  );
}

/* ---------- Cabeçalho de subpágina com voltar ---------- */
export function SubHead({ title, subtitle, onBack, action }: { title: string; subtitle?: string; onBack: () => void; action?: ReactNode }) {
  return (
    <header className="page-head row" style={{ gap: 10, alignItems: 'center' }}>
      <button className="icon-btn" aria-label="Voltar" onClick={onBack}><Icon name="chevronLeft" /></button>
      <div className="grow">
        <h1 style={{ fontSize: 'var(--fs-xl)' }}>{title}</h1>
        {subtitle && <p style={{ marginTop: 2 }}>{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}
