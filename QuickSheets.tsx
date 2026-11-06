/* Folha "Registrar" (escolha do tipo) e roteamento para cada formulário. */
import { useApp } from './AppContext';
import { Sheet } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { KIND_META } from '@/config/categories';
import type { QuickKind } from '@/types/models';
import { GlucoseForm } from '@/features/glucose/GlucoseForm';
import { MealForm } from '@/features/food/MealForm';
import { InsulinForm } from '@/features/insulin/InsulinForm';
import { MedicationEditor, MedicationIntakeForm } from '@/features/medications/MedicationForms';
import { ActivityForm } from '@/features/activity/ActivityForm';
import { MoodForm } from '@/features/mood/MoodForm';
import { EventForm } from '@/features/day/EventForm';
import { WeightForm } from '@/features/body/WeightForm';

const PICKER: QuickKind[] = ['glucose', 'meal', 'insulin', 'medication', 'activity', 'mood', 'weight', 'event'];

export function QuickSheets() {
  const { quick, closeQuick, pickerOpen, setPickerOpen, openQuick, t, mode } = useApp();
  const kinds = mode === 'easy' ? PICKER.filter((k) => k !== 'event') : PICKER;

  return (
    <>
      <Sheet open={pickerOpen} title={t('O que você quer registrar?', 'O que vamos anotar?')} onClose={() => setPickerOpen(false)}>
        <div className="quick" style={{ ['--quick-cols' as string]: mode === 'easy' ? 2 : 3 }}>
          {kinds.map((k) => {
            const m = KIND_META[k];
            return (
              <button key={k} className="quick-btn" onClick={() => openQuick(k)}>
                <span className={`cat tone-${m.tone}`}><Icon name={m.icon} /></span>
                {t(m.label, m.labelChild)}
              </button>
            );
          })}
        </div>
      </Sheet>
      {quick && renderForm(quick.kind, quick.editId, quick.preset, closeQuick)}
    </>
  );
}

function renderForm(kind: QuickKind, editId: string | undefined, preset: Record<string, unknown> | undefined, onDone: () => void) {
  const props = { editId, preset, onDone };
  switch (kind) {
    case 'glucose': return <GlucoseForm {...props} />;
    case 'meal': return <MealForm {...props} />;
    case 'insulin': return <InsulinForm {...props} />;
    case 'medication': return preset?.editor ? <MedicationEditor {...props} /> : <MedicationIntakeForm {...props} />;
    case 'activity': return <ActivityForm {...props} />;
    case 'mood': return <MoodForm {...props} />;
    case 'weight': return <WeightForm {...props} />;
    case 'event': return <EventForm {...props} />;
  }
}
