/* =========================================================
   Roteador por hash (#/glicose). Funciona em qualquer
   hospedagem estática sem configurar rewrites, e dentro do
   service worker offline. Pode ser trocado por React Router
   sem alterar as páginas (use `useRoute` / `navigate`).
   ========================================================= */
import { useEffect, useState } from 'react';

export interface Route { path: string; segments: string[]; query: URLSearchParams; }

function parse(): Route {
  const raw = window.location.hash.replace(/^#/, '') || '/';
  const [p, q = ''] = raw.split('?');
  const path = '/' + p.split('/').filter(Boolean).join('/');
  return { path, segments: path.split('/').filter(Boolean), query: new URLSearchParams(q) };
}

export function navigate(to: string, opts: { replace?: boolean } = {}) {
  const hash = '#' + (to.startsWith('/') ? to : '/' + to);
  if (opts.replace) window.history.replaceState(null, '', hash);
  else window.history.pushState(null, '', hash);
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

export function back(fallback = '/') {
  if (window.history.length > 1) window.history.back();
  else navigate(fallback, { replace: true });
}

export function useRoute(): Route {
  const [route, setRoute] = useState(parse);
  useEffect(() => {
    const on = () => setRoute(parse());
    window.addEventListener('hashchange', on);
    window.addEventListener('popstate', on);
    return () => { window.removeEventListener('hashchange', on); window.removeEventListener('popstate', on); };
  }, []);
  return route;
}

export const ROUTES = {
  home: '/',
  day: '/meu-dia',
  glucose: '/glicose',
  food: '/alimentacao',
  health: '/saude',
  learn: '/aprender',
  profile: '/perfil',
} as const;
