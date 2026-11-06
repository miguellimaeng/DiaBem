/* Saúde — "Onde estão meus exames e consultas?" */
import { useApp } from '@/app/AppContext';
import { useData } from '@/app/useData';
import { navigate } from '@/app/router';
import { repo } from '@/database/repositories';
import { Cat, Disclaimer, PageHead } from '@/components/ui';
import { Icon, type IconName } from '@/components/Icon';
import type { Tone } from '@/types/models';
import { fmtDateShort } from '@/utils/date';
import { SPECIALTY_LABEL } from '@/config/categories';
import { HistoryNotesCard } from './HistoryNotesCard';

const ITEMS: { path: string; title: string; sub: string; icon: IconName; tone: Tone }[] = [
  { path: 'exames', title: 'Exames', sub: 'PDF, foto e histórico', icon: 'flask', tone: 'blue' },
  { path: 'consultas', title: 'Consultas', sub: 'Agenda e lembretes', icon: 'calendar', tone: 'teal' },
  { path: 'medicamentos', title: 'Medicamentos', sub: 'Rotina e registros', icon: 'pill', tone: 'green' },
  { path: 'estatisticas', title: 'Estatísticas', sub: 'Evolução e hábitos', icon: 'barChart', tone: 'violet' },
  { path: 'preparar', title: 'Relatórios', sub: 'Preparar consulta', icon: 'fileText', tone: 'amber' },
  { path: 'emergencia', title: 'Emergência', sub: 'Dados essenciais', icon: 'alert', tone: 'rose' },
];

export function HealthPage() {
  const { t, mode } = useApp();
  const { data } = useData(async () => {
    const [appts, exams, meds] = await Promise.all([repo.appointments.all(), repo.exams.all(), repo.medications.all()]);
    const next = appts.filter((a) => new Date(a.at).getTime() > Date.now()).sort((a, b) => a.at.localeCompare(b.at))[0];
    const lastExam = exams.sort((a, b) => b.date.localeCompare(a.date))[0];
    return { next, lastExam, meds: meds.filter((m) => m.active).length };
  }, []);

  const hints: Record<string, string | undefined> = {
    consultas: data?.next ? `Próxima: ${SPECIALTY_LABEL[data.next.specialty]}, ${fmtDateShort(data.next.at)}` : undefined,
    exames: data?.lastExam ? `Último: ${fmtDateShort(data.lastExam.date + 'T12:00')}` : undefined,
    medicamentos: data?.meds ? `${data.meds} em uso` : undefined,
  };

  return (
    <div>
      <PageHead title="Saúde" subtitle={t('Onde estão meus exames e consultas?', 'Seus exames, consultas e remédios')} />
      <div className={mode === 'easy' ? 'stack' : 'grid-2'}>
        {ITEMS.map((it) => (
          <button key={it.path} className="card clickable tight" onClick={() => navigate(`/saude/${it.path}`)}
            style={mode === 'easy' ? { display: 'flex', alignItems: 'center', gap: 12 } : undefined}>
            <Cat icon={it.icon} tone={it.tone} size={mode === 'easy' ? 'lg' : undefined} />
            <div className={mode === 'easy' ? 'grow' : 'mt-3'}>
              <div className="strong">{it.title}</div>
              <div className="xsmall muted">{hints[it.path] ?? it.sub}</div>
            </div>
            {mode === 'easy' && <Icon name="chevronRight" />}
          </button>
        ))}
      </div>
      <div className="mt-4"><HistoryNotesCard /></div>
      <Disclaimer />
    </div>
  );
}
