/* =========================================================
   Lembretes locais.
   Limitação conhecida de PWAs: sem servidor de push, o
   navegador só exibe lembretes enquanto o app está aberto
   ou em segundo plano recente. A terceira etapa (backend)
   trará Web Push para lembretes confiáveis.
   ========================================================= */
export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission !== 'default') return Notification.permission;
  return Notification.requestPermission();
}

export async function showLocalNotification(title: string, body: string, url = './') {
  if (!('Notification' in window) || Notification.permission !== 'granted') return false;
  const reg = await navigator.serviceWorker?.getRegistration();
  if (reg) await reg.showNotification(title, { body, icon: './icons/icon-192.png', badge: './icons/icon-192.png', data: { url } });
  else new Notification(title, { body });
  return true;
}

const timers = new Map<string, number>();

/** Agenda um lembrete enquanto o app estiver aberto (até 24 h). */
export function scheduleInSession(key: string, at: Date, title: string, body: string, url?: string) {
  const ms = at.getTime() - Date.now();
  if (ms <= 0 || ms > 24 * 3600 * 1000) return;
  clearTimeout(timers.get(key));
  timers.set(key, window.setTimeout(() => showLocalNotification(title, body, url), ms));
}
export function clearScheduled() { timers.forEach((t) => clearTimeout(t)); timers.clear(); }
