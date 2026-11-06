import type { ReactNode } from 'react';
import { useApp } from '@/app/AppContext';
import { navigate, useRoute, ROUTES } from '@/app/router';
import { Icon, type IconName } from '../Icon';
import { QuickSheets } from '@/app/QuickSheets';
import { APP_CONFIG } from '@/config/app.config';

interface NavItem { path: string; label: string; icon: IconName; }

const NAV: NavItem[] = [
  { path: ROUTES.home, label: 'Início', icon: 'home' },
  { path: ROUTES.day, label: 'Meu Dia', icon: 'calendarDay' },
  { path: ROUTES.glucose, label: 'Glicose', icon: 'drop' },
  { path: ROUTES.food, label: 'Alimentação', icon: 'utensils' },
  { path: ROUTES.health, label: 'Saúde', icon: 'heart' },
  { path: ROUTES.learn, label: 'Aprender', icon: 'graduation' },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { mode, setPickerOpen, t, profile } = useApp();
  const route = useRoute();
  // Modo Fácil: navegação simplificada (Meu Dia fica acessível pelo Início)
  const nav = mode === 'easy' ? NAV.filter((n) => n.path !== ROUTES.day) : NAV;
  const active = (p: string) => (p === '/' ? route.path === '/' : route.path.startsWith(p));

  return (
    <div className="app">
      <a href="#conteudo" className="skip-link" onClick={(e) => { e.preventDefault(); document.getElementById('conteudo')?.focus(); }}>Ir para o conteúdo</a>
      <header className="topbar">
        <button className="brand" style={{ border: 0, background: 'none', padding: 0 }} onClick={() => navigate('/')} aria-label={`${APP_CONFIG.name} — início`}>
          <span className="brand-mark"><Icon name="drop" size={16} strokeWidth={2.4} /></span>
          {APP_CONFIG.name}
        </button>
        <div className="topbar-actions">
          <button className="icon-btn danger" aria-label="Abrir tela de emergência" title="Emergência" onClick={() => navigate('/saude/emergencia')}>
            <Icon name="alert" />
          </button>
          <button className="icon-btn soft" aria-label={`Perfil e configurações${profile?.name ? ' de ' + profile.name : ''}`} onClick={() => navigate(ROUTES.profile)}>
            <Icon name="user" />
          </button>
        </div>
      </header>

      <main id="conteudo" className="content" tabIndex={-1} style={{ outline: 'none' }}>{children}</main>

      <button className="fab" onClick={() => setPickerOpen(true)} aria-label="Registrar algo novo">
        <Icon name="plus" size={22} strokeWidth={2.4} />
        <span>{t('Registrar', 'Anotar')}</span>
      </button>

      <nav className="bottom-nav" aria-label="Navegação principal" style={{ ['--nav-cols' as string]: nav.length }}>
        {nav.map((n) => (
          <a key={n.path} href={`#${n.path}`} className="nav-item" aria-current={active(n.path) ? 'page' : undefined}>
            <Icon name={n.icon} size={mode === 'easy' ? 24 : 21} />
            <span>{n.label}</span>
          </a>
        ))}
      </nav>

      <QuickSheets />
    </div>
  );
}
