/* Temas de cores disponíveis (as cores ficam em styles/themes.css). */
import type { ThemeName } from '@/types/models';

export interface ThemeMeta { id: ThemeName; label: string; desc: string; swatch: string; themeColor: string; }

export const THEMES: ThemeMeta[] = [
  { id: 'oceano', label: 'Oceano', desc: 'Azul e turquesa, vibrante e tranquilo', swatch: 'linear-gradient(135deg,#1d4ed8,#0e7490)', themeColor: '#1D4ED8' },
  { id: 'aurora', label: 'Aurora', desc: 'Violeta e verde-água, moderno', swatch: 'linear-gradient(135deg,#4338ca,#0f766e)', themeColor: '#4338CA' },
  { id: 'por-do-sol', label: 'Pôr do sol', desc: 'Laranja e pink, quente e alegre', swatch: 'linear-gradient(135deg,#c2410c,#be185d)', themeColor: '#C2410C' },
  { id: 'neutro', label: 'Neutro claro', desc: 'Branco e preto, o mais fácil de ler', swatch: 'linear-gradient(135deg,#ffffff 50%,#0a66d8 50%)', themeColor: '#F2F2F7' },
  { id: 'classico', label: 'Clássico', desc: 'O azul original do DiaBem', swatch: 'linear-gradient(135deg,#416ddf,#6890ea)', themeColor: '#3F6FE5' },
];

export const DEFAULT_THEME: ThemeName = 'oceano';

/** Ícone de cada tema (capa, cabeçalho e ícone de instalação). */
export const themeIcon = (id: ThemeName) => ({
  svg: `./icons/themes/${id}.svg`,
  apple: `./icons/themes/${id}-apple-180.png`,
  favicon: `./icons/themes/${id}-favicon-32.png`,
  manifest: `./manifest-${id}.webmanifest`,
});

/** Troca o ícone e o manifesto da página para o tema escolhido.
 *  O ícone da tela de início é definido no momento da instalação. */
export function applyThemeIcons(id: ThemeName) {
  const ic = themeIcon(id);
  const set = (sel: string, href: string) => document.querySelector<HTMLLinkElement>(sel)?.setAttribute('href', href);
  set('link[rel="manifest"]', ic.manifest);
  set('link[rel="apple-touch-icon"]', ic.apple);
  set('link[rel="icon"]', ic.svg);
}
export const themeMeta = (id: ThemeName) => THEMES.find((t) => t.id === id) ?? THEMES[0];
