/* Escolha do tema de cores, com amostra de cada um. */
import { THEMES, themeIcon } from '@/config/themes';
import type { ThemeName } from '@/types/models';
import { Icon } from './Icon';

export function ThemePicker({ value, onChange }: { value: ThemeName; onChange: (t: ThemeName) => void }) {
  return (
    <div className="theme-grid" role="radiogroup" aria-label="Cores do app">
      {THEMES.map((t) => (
        <button key={t.id} type="button" role="radio" aria-checked={value === t.id} className="theme-opt" onClick={() => onChange(t.id)}>
          <span className="theme-swatch" style={{ background: t.swatch }} aria-hidden="true">
            <img className="theme-icon" src={themeIcon(t.id).svg} alt="" width={36} height={36} />
            {value === t.id && <span className="theme-check"><Icon name="check" size={14} strokeWidth={3} /></span>}
          </span>
          <span className="theme-name">{t.label}</span>
          <span className="theme-desc">{t.desc}</span>
        </button>
      ))}
    </div>
  );
}
