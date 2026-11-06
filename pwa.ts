/* Registro do service worker e evento de instalação. */
export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  if (import.meta.env.DEV) return; // evita cache confuso durante o desenvolvimento
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((e) => console.warn('[DiaBem] SW não registrado', e));
  });
}

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> };
let deferred: BIPEvent | null = null;
const subs = new Set<(can: boolean) => void>();

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferred = e as BIPEvent;
  subs.forEach((s) => s(true));
});
window.addEventListener('appinstalled', () => { deferred = null; subs.forEach((s) => s(false)); });

export const install = {
  canPrompt: () => !!deferred,
  subscribe(fn: (can: boolean) => void) { subs.add(fn); return () => { subs.delete(fn); }; },
  async prompt() {
    if (!deferred) return false;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    deferred = null; subs.forEach((s) => s(false));
    return outcome === 'accepted';
  },
  isStandalone: () =>
    window.matchMedia?.('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true,
  isIOS: () => /iphone|ipad|ipod/i.test(navigator.userAgent),
};
