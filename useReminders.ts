/* Agenda lembretes locais da sessão (consultas e medicamentos). */
import { useEffect } from 'react';
import { repo, onDataChange } from '@/database/repositories';
import { clearScheduled, scheduleInSession } from '@/services/reminders';
import { SPECIALTY_LABEL } from '@/config/categories';
import { fmtTime, fromLocalInputs, toLocalDateInput } from '@/utils/date';

export function useReminders(enabled: boolean) {
  useEffect(() => {
    if (!enabled) { clearScheduled(); return; }
    async function plan() {
      clearScheduled();
      const [appts, meds] = await Promise.all([repo.appointments.all(), repo.medications.all()]);
      for (const a of appts.filter((x) => x.reminder && !x.isDemo)) {
        const t = new Date(a.at);
        scheduleInSession(`ap-${a.id}-2h`, new Date(t.getTime() - 2 * 3600_000), 'Consulta hoje', `${SPECIALTY_LABEL[a.specialty]} às ${fmtTime(a.at)}`, './#/saude/consultas');
        scheduleInSession(`ap-${a.id}-1d`, new Date(t.getTime() - 24 * 3600_000), 'Consulta amanhã', `${SPECIALTY_LABEL[a.specialty]} às ${fmtTime(a.at)}. Que tal preparar o resumo?`, './#/saude/preparar');
      }
      const today = toLocalDateInput();
      for (const m of meds.filter((x) => x.active && x.reminder && !x.isDemo)) {
        for (const tm of m.times) scheduleInSession(`med-${m.id}-${tm}`, new Date(fromLocalInputs(today, tm)), 'Lembrete de medicamento', `${m.name} · ${m.dose}`, './#/saude/medicamentos');
      }
    }
    plan();
    return onDataChange((s) => { if (s === 'appointments' || s === 'medications') plan(); });
  }, [enabled]);
}
