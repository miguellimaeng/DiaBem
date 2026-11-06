/* Cores e ícones fixos por categoria — usados em todo o app. */
import type { IconName } from '@/components/Icon';
import type { Evidence, InsulinMoment, MealType, MoodLevel, QuickKind, Specialty, Tone, Intensity, InsulinKind, MedicationFrequency, MedicationStatus, DiabetesType, ExamIndicator, DayEventKind } from '@/types/models';

export const KIND_META: Record<QuickKind, { label: string; labelChild?: string; icon: IconName; tone: Tone }> = {
  glucose:    { label: 'Glicose', icon: 'drop', tone: 'blue' },
  meal:       { label: 'Refeição', labelChild: 'Comida', icon: 'utensils', tone: 'amber' },
  insulin:    { label: 'Insulina', icon: 'syringe', tone: 'violet' },
  medication: { label: 'Medicamento', labelChild: 'Remédio', icon: 'pill', tone: 'green' },
  activity:   { label: 'Atividade', labelChild: 'Movimento', icon: 'footprints', tone: 'teal' },
  mood:       { label: 'Como estou', labelChild: 'Como me sinto', icon: 'smile', tone: 'rose' },
  weight:     { label: 'Peso', icon: 'scale', tone: 'teal' },
  event:      { label: 'Outro evento', labelChild: 'Outra coisa', icon: 'note', tone: 'gray' },
};

export const QUICK_ORDER: QuickKind[] = ['glucose', 'meal', 'insulin', 'medication', 'activity', 'mood'];

export const MEAL_LABEL: Record<MealType, string> = {
  breakfast: 'Café da manhã', lunch: 'Almoço', dinner: 'Jantar', snack: 'Lanche', other: 'Outro',
};

export const MOOD_META: Record<MoodLevel, { label: string; tone: Tone }> = {
  great: { label: 'Muito bem', tone: 'green' },
  good: { label: 'Bem', tone: 'teal' },
  ok: { label: 'Normal', tone: 'blue' },
  tired: { label: 'Cansado(a)', tone: 'violet' },
  stressed: { label: 'Estressado(a)', tone: 'amber' },
  bad: { label: 'Mal', tone: 'rose' },
  other: { label: 'Outro', tone: 'gray' },
};

export const SYMPTOMS = [
  'Muita sede', 'Muita fome', 'Tremor', 'Suor', 'Tontura', 'Dor de cabeça',
  'Visão embaçada', 'Cansaço', 'Vontade de urinar', 'Irritação', 'Formigamento', 'Náusea',
];

export const INTENSITY_LABEL: Record<Intensity, string> = { light: 'Leve', moderate: 'Moderada', intense: 'Intensa' };
export const INSULIN_KIND_LABEL: Record<InsulinKind, string> = { basal: 'Basal', bolus: 'Bolus', other: 'Outro' };

export const ACTIVITY_TYPES = ['Caminhada', 'Corrida', 'Bicicleta', 'Natação', 'Musculação', 'Dança', 'Futebol', 'Alongamento', 'Brincadeira', 'Outro'];

export const SPECIALTY_LABEL: Record<Specialty, string> = {
  endocrinologist: 'Endocrinologista', general: 'Clínico geral', nutritionist: 'Nutricionista',
  ophthalmologist: 'Oftalmologista', cardiologist: 'Cardiologista', nephrologist: 'Nefrologista',
  podiatrist: 'Podólogo', other: 'Outro',
};

export const FREQUENCY_LABEL: Record<MedicationFrequency, string> = {
  daily: '1x ao dia', twice_daily: '2x ao dia', three_times_daily: '3x ao dia', weekly: 'Semanal', as_needed: 'Quando necessário', other: 'Outra',
};

export const MED_STATUS_META: Record<MedicationStatus, { label: string; tone: Tone }> = {
  taken: { label: 'Tomado', tone: 'green' }, not_taken: { label: 'Não tomado', tone: 'gray' }, postponed: { label: 'Adiado', tone: 'amber' },
};

export const DIABETES_TYPE_LABEL: Record<DiabetesType, string> = {
  type1: 'Diabetes tipo 1', type2: 'Diabetes tipo 2', lada: 'LADA', gestational: 'Diabetes gestacional', other: 'Outro tipo', unspecified: 'Prefiro não informar',
};

export const INDICATOR_META: Record<ExamIndicator, { label: string; unit: string }> = {
  hba1c: { label: 'HbA1c (hemoglobina glicada)', unit: '%' },
  fasting_glucose: { label: 'Glicemia de jejum', unit: 'mg/dL' },
  total_cholesterol: { label: 'Colesterol total', unit: 'mg/dL' },
  hdl: { label: 'HDL', unit: 'mg/dL' },
  ldl: { label: 'LDL', unit: 'mg/dL' },
  triglycerides: { label: 'Triglicerídeos', unit: 'mg/dL' },
  creatinine: { label: 'Creatinina', unit: 'mg/dL' },
  egfr: { label: 'eTFG (filtração renal estimada)', unit: 'mL/min/1,73 m²' },
  sodium: { label: 'Sódio', unit: 'mEq/L' },
  potassium: { label: 'Potássio', unit: 'mEq/L' },
  microalbuminuria: { label: 'Microalbuminúria', unit: 'mg/g' },
  other: { label: 'Outro', unit: '' },
};

export const DAY_EVENT_META: Record<DayEventKind, { label: string; icon: IconName; tone: Tone }> = {
  sleep: { label: 'Sono', icon: 'moon', tone: 'violet' },
  note: { label: 'Anotação', icon: 'note', tone: 'gray' },
  water: { label: 'Água', icon: 'water', tone: 'blue' },
  other: { label: 'Outro', icon: 'circle', tone: 'gray' },
};

export const INSULIN_MOMENT_LABEL: Record<InsulinMoment, string> = {
  before_breakfast: 'Antes do café', before_lunch: 'Antes do almoço', before_dinner: 'Antes do jantar', bedtime: 'Ao deitar', other: 'Outro horário',
};
export const INSULIN_MOMENT_ORDER: InsulinMoment[] = ['before_breakfast', 'before_lunch', 'before_dinner', 'bedtime', 'other'];

export const EVIDENCE_META: Record<Evidence, { label: string; tone: 'green' | 'amber' | 'gray' }> = {
  document: { label: 'Confirmado em documento', tone: 'green' },
  reported: { label: 'Relatado', tone: 'amber' },
  pending: { label: 'Pendente de confirmação', tone: 'gray' },
};
