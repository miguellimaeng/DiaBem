import { useEffect } from 'react';
import { AppProvider, useApp } from './app/AppContext';
import { useRoute } from './app/router';
import { useReminders } from './app/useReminders';
import { AppShell } from './components/layout/AppShell';
import { HomePage } from './features/home/HomePage';
import { DayPage } from './features/day/DayPage';
import { GlucosePage } from './features/glucose/GlucosePage';
import { FoodPage } from './features/food/FoodPage';
import { RecipePage } from './features/food/RecipePage';
import { HealthPage } from './features/health/HealthPage';
import { ExamsPage } from './features/exams/ExamsPage';
import { AppointmentsPage } from './features/appointments/AppointmentsPage';
import { MedicationsPage } from './features/medications/MedicationsPage';
import { StatisticsPage } from './features/statistics/StatisticsPage';
import { PreparePage } from './features/reports/PreparePage';
import { EmergencyPage } from './features/emergency/EmergencyPage';
import { LearnPage } from './features/education/LearnPage';
import { LessonPage } from './features/education/LessonPage';
import { ProfilePage } from './features/profile/ProfilePage';
import { Onboarding } from './features/profile/Onboarding';
import { Empty, Button } from './components/ui';
import { navigate } from './app/router';

function Router() {
  const { segments } = useRoute();
  const [a, b, c] = segments;
  useEffect(() => { window.scrollTo({ top: 0 }); }, [a, b, c]);

  switch (a) {
    case undefined: return <HomePage />;
    case 'meu-dia': return <DayPage />;
    case 'glicose': return <GlucosePage />;
    case 'alimentacao': return b === 'receita' && c ? <RecipePage id={c} /> : <FoodPage />;
    case 'saude':
      switch (b) {
        case 'exames': return <ExamsPage />;
        case 'consultas': return <AppointmentsPage />;
        case 'medicamentos': return <MedicationsPage />;
        case 'estatisticas': return <StatisticsPage />;
        case 'preparar': case 'relatorios': return <PreparePage />;
        case 'emergencia': return <EmergencyPage />;
        default: return <HealthPage />;
      }
    case 'aprender': return b ? <LessonPage id={b} /> : <LearnPage />;
    case 'perfil': return <ProfilePage />;
    default: return <Empty icon="info" title="Página não encontrada" action={<Button onClick={() => navigate('/')}>Ir para o início</Button>} />;
  }
}

function Root() {
  const { ready, settings } = useApp();
  const { segments } = useRoute();
  useReminders(settings.remindersEnabled);

  if (!ready) return <div className="empty" style={{ minHeight: '100dvh', justifyContent: 'center' }} aria-busy="true">Carregando…</div>;
  // A tela de emergência abre mesmo sem onboarding (atalho do ícone instalado).
  if (!settings.onboardingDone && !(segments[0] === 'saude' && segments[1] === 'emergencia')) return <Onboarding />;
  return <AppShell><Router /></AppShell>;
}

export default function App() {
  return <AppProvider><Root /></AppProvider>;
}
