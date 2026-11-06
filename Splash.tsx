/* =========================================================
   Capa do app — aparece ao abrir (uma vez por sessão) e
   como primeira tela do cadastro. Usa as cores do tema.
   Toque para pular; sem animação se "reduzir movimento".
   ========================================================= */
import type { ReactNode } from 'react';
import { APP_CONFIG } from '@/config/app.config';
import { DEFAULT_THEME, themeIcon } from '@/config/themes';
import type { ThemeName } from '@/types/models';
import { Icon } from './Icon';

export function CoverArt({ children, compact, theme }: { children?: ReactNode; compact?: boolean; theme?: ThemeName }) {
  const t = theme ?? ((document.documentElement.dataset.theme as ThemeName) || DEFAULT_THEME);
  return (
    <div className={`cover ${compact ? 'cover-compact' : ''}`}>
      <span className="cover-blob b1" aria-hidden="true" />
      <span className="cover-blob b2" aria-hidden="true" />
      <span className="cover-blob b3" aria-hidden="true" />
      <div className="cover-stage" aria-hidden="true">
        <div className="cover-float f1"><span className="cover-dot" style={{ background: '#3b82f6' }}><Icon name="drop" size={14} /></span><div><b>112</b> <small>mg/dL</small><em>Glicose · 08:10</em></div></div>
        <div className="cover-float f2"><span className="cover-dot" style={{ background: '#10b981' }}><Icon name="check" size={14} strokeWidth={3} /></span><div><b>4 de 5</b><em>Rotina de hoje</em></div></div>
        <div className="cover-float f3"><span className="cover-dot" style={{ background: '#f59e0b' }}><Icon name="graduation" size={14} /></span><div><b>Missão</b><em>2 min de aula</em></div></div>
        <img className="cover-icon" src={themeIcon(t).svg} alt="" width={132} height={132} />
      </div>
      <div className="cover-brand">
        <h1>{APP_CONFIG.name}</h1>
        <p>{APP_CONFIG.tagline}</p>
      </div>
      {children}
    </div>
  );
}

export function Splash({ onDone, theme }: { onDone: () => void; theme?: ThemeName }) {
  return (
    <button className="splash" onClick={onDone} aria-label={`${APP_CONFIG.name}. Toque para continuar`} onAnimationEnd={(e) => { if (e.animationName === 'splash-out') onDone(); }}>
      <CoverArt compact theme={theme} />
    </button>
  );
}
