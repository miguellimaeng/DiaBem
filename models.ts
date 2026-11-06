/* =========================================================
   DiaBem — Modelo de dados
   Todo registro persistido estende BaseRecord. Os campos de
   sincronização já existem para o backend futuro (Supabase):
   o app funciona 100% local e só marca o que mudou.
   ========================================================= */

export type ID = string;
/** Data/hora em ISO 8601 (ex.: 2026-11-06T08:10:00.000Z) */
export type ISODateTime = string;
/** Data no formato AAAA-MM-DD */
export type ISODate = string;

export type SyncStatus = 'local' | 'pending' | 'synced' | 'conflict';

export interface BaseRecord {
  id: ID;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
  /** Soft delete — necessário para propagar exclusões na sincronização. */
  deletedAt?: ISODateTime | null;
  syncStatus: SyncStatus;
  /** Dados de demonstração nunca se misturam a registros reais em relatórios. */
  isDemo?: boolean;
  /** Origem do registro: manual ou integração futura (CGM, glicosímetro…). */
  source?: RecordSource;
}

export type RecordSource = 'manual' | 'demo' | 'import' | 'dexcom' | 'libre' | 'bluetooth-meter' | 'apple-health' | 'health-connect';

/** Registros que acontecem num momento do dia. */
export interface TimedRecord extends BaseRecord {
  /** Momento do evento (ISO). */
  at: ISODateTime;
  note?: string;
}

/* ---------- Usuário e configurações ---------- */

export type ExperienceMode = 'adult' | 'child' | 'easy';
export type DiabetesType = 'type1' | 'type2' | 'lada' | 'gestational' | 'other' | 'unspecified';
export type GlucoseUnit = 'mg/dL' | 'mmol/L';
export type FontSize = 'md' | 'lg' | 'xl';

export interface UserProfile {
  id: 'me';
  name: string;
  diabetesType: DiabetesType;
  birthYear?: number;
  /** Quem usa o app: a própria pessoa ou um cuidador gerenciando o perfil. */
  managedBy: 'self' | 'caregiver';
  /** Histórico informado (ex.: resumo trazido pela família). Nunca tratado como laudo. */
  historyNotes?: HistoryNote[];
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

/** Grau de confirmação de uma informação de saúde. */
export type Evidence = 'document' | 'reported' | 'pending';

export interface HistoryNote {
  id: ID;
  title: string;
  text: string;
  /** Data ou período, como informado (ex.: "Outubro/2026"). Texto livre de propósito. */
  when?: string;
  evidence: Evidence;
  source?: string;
}

/**
 * Faixa definida pelo usuário ou pelo profissional.
 * O app NÃO define faixa clínica padrão: sem configuração, `null`.
 */
export interface GlucoseTargetRange {
  lowMgdl: number;
  highMgdl: number;
  definedBy: 'user' | 'professional';
  updatedAt: ISODateTime;
}

export interface Consent {
  /** Aceite do armazenamento local dos dados de saúde neste aparelho. */
  localStorage: boolean;
  /** Ciência de que o app não substitui orientação profissional. */
  medicalDisclaimer: boolean;
  acceptedAt: ISODateTime;
  version: number;
}

export interface AppSettings {
  id: 'settings';
  mode: ExperienceMode;
  fontSize: FontSize;
  reduceMotion: boolean;
  glucoseUnit: GlucoseUnit;
  targetRange: GlucoseTargetRange | null;
  consent: Consent | null;
  onboardingDone: boolean;
  demoLoaded: boolean;
  remindersEnabled: boolean;
  updatedAt: ISODateTime;
}

/* ---------- Glicose ---------- */

export type GlucoseContext = 'fasting' | 'before_meal' | 'after_meal' | 'bedtime' | 'exercise' | 'other';

export interface GlucoseRecord extends TimedRecord {
  /** Sempre armazenado em mg/dL (fonte da verdade para cálculos). */
  valueMgdl: number;
  /** Unidade em que o usuário digitou — preservada para auditoria. */
  enteredUnit: GlucoseUnit;
  enteredValue: number;
  context: GlucoseContext;
}

/* ---------- Alimentação ---------- */

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'other';

export interface MealRecord extends TimedRecord {
  mealType: MealType;
  description: string;
  /** Foto guardada localmente como Blob (no backend futuro: storage). */
  photo?: Blob | null;
  /** Opcional e informado pelo próprio usuário. */
  carbsGrams?: number | null;
  favorite?: boolean;
  recipeId?: ID;
  /** Reservado para análise de foto futura — nunca preenchido automaticamente nesta versão. */
  photoAnalysis?: FoodPhotoAnalysis | null;
}

export interface FoodPhotoAnalysis {
  provider: string;
  analyzedAt: ISODateTime;
  items: { name: string; confidence: number; carbsGramsEstimate?: number }[];
  /** A estimativa precisa ser confirmada pelo usuário antes de ser usada. */
  confirmedByUser: boolean;
}

/* ---------- Insulina ---------- */

export type InsulinKind = 'basal' | 'bolus' | 'other';

/** Apenas registro. O app nunca calcula nem sugere doses. */
export interface InsulinRecord extends TimedRecord {
  kind: InsulinKind;
  name?: string;
  dose: number;
  unit: 'U' | 'mL' | 'other';
}

/**
 * Esquema de insulina COPIADO DA RECEITA pelo usuário/familiar.
 * O app não cria, calcula nem ajusta este esquema — apenas exibe o que foi transcrito,
 * com a indicação de estar confirmado (ou não) na receita original.
 */
export type InsulinMoment = 'before_breakfast' | 'before_lunch' | 'before_dinner' | 'bedtime' | 'other';

export interface InsulinPlanItem extends BaseRecord {
  kind: InsulinKind;
  name: string;
  concentration?: string;
  moment: InsulinMoment;
  /** Horário aproximado, se a receita informar (HH:mm). */
  time?: string;
  doseUnits: number;
  /** false = transcrição pendente de conferência na receita original. */
  confirmed: boolean;
  prescriber?: string;
  prescriptionDate?: ISODate;
  note?: string;
  active: boolean;
}

/* ---------- Medicamentos ---------- */

export type MedicationFrequency = 'daily' | 'twice_daily' | 'three_times_daily' | 'weekly' | 'as_needed' | 'other';

export interface Medication extends BaseRecord {
  name: string;
  dose: string;
  /** Horários no formato HH:mm */
  times: string[];
  frequency: MedicationFrequency;
  note?: string;
  active: boolean;
  important?: boolean;
  reminder: boolean;
}

export type MedicationStatus = 'taken' | 'not_taken' | 'postponed';

export interface MedicationRecord extends TimedRecord {
  medicationId: ID;
  medicationName: string;
  status: MedicationStatus;
  scheduledTime?: string;
}

/* ---------- Atividade, humor, eventos livres ---------- */

export type Intensity = 'light' | 'moderate' | 'intense';

export interface ActivityRecord extends TimedRecord {
  activityType: string;
  durationMin: number;
  intensity: Intensity;
}

export type MoodLevel = 'great' | 'good' | 'ok' | 'tired' | 'stressed' | 'bad' | 'other';

export interface MoodRecord extends TimedRecord {
  mood: MoodLevel;
  symptoms: string[];
}

/** Eventos livres da linha do tempo (sono, anotação, etc.). */
export type DayEventKind = 'sleep' | 'note' | 'water' | 'other';
export interface DayEvent extends TimedRecord {
  kind: DayEventKind;
  title: string;
  detail?: string;
}

/* ---------- Saúde: exames e consultas ---------- */

export interface ExamAttachment {
  name: string;
  type: string;
  size: number;
  blob: Blob;
}

export interface Exam extends BaseRecord {
  name: string;
  date: ISODate;
  lab?: string;
  note?: string;
  attachments: ExamAttachment[];
}

export type ExamIndicator =
  | 'hba1c' | 'fasting_glucose' | 'total_cholesterol' | 'hdl' | 'ldl'
  | 'triglycerides' | 'creatinine' | 'egfr' | 'microalbuminuria' | 'sodium' | 'potassium' | 'other';

/** Valor transcrito pelo usuário — o app não interpreta resultados. */
export interface ExamResult extends BaseRecord {
  examId?: ID;
  indicator: ExamIndicator;
  customName?: string;
  value: number;
  unit: string;
  date: ISODate;
  /** Faixa de referência impressa no laudo, se o usuário quiser registrar. */
  labReference?: string;
  /** Conferido no laudo original? Valores transcritos de conversas ficam `false`. */
  verified?: boolean;
  note?: string;
}

export type Specialty =
  | 'endocrinologist' | 'general' | 'nutritionist' | 'ophthalmologist'
  | 'cardiologist' | 'nephrologist' | 'podiatrist' | 'other';

export interface Appointment extends BaseRecord {
  at: ISODateTime;
  doctor?: string;
  specialty: Specialty;
  location?: string;
  note?: string;
  reminder: boolean;
}

/** Perguntas e anotações para levar à consulta. */
export interface ConsultationQuestion extends BaseRecord {
  text: string;
  appointmentId?: ID;
  done: boolean;
}

/* ---------- Receitas ---------- */

export type RecipeCategory = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'dessert' | 'quick';

export interface NutritionInfo {
  /** Só preenchido quando há fonte confiável — nunca inventado. */
  carbsGrams?: number;
  proteinGrams?: number;
  fatGrams?: number;
  fiberGrams?: number;
  kcal?: number;
  servings?: number;
  source: string;
}

export interface Recipe {
  id: ID;
  name: string;
  categories: RecipeCategory[];
  timeMin: number;
  difficulty: 'easy' | 'medium' | 'hard';
  ingredients: string[];
  steps: string[];
  tip?: string;
  nutrition?: NutritionInfo | null;
  illustration: 'salad' | 'omelet' | 'oats' | 'fish' | 'soup' | 'yogurt' | 'chicken' | 'fruit';
  isDemo?: boolean;
}

export interface RecipeFavorite { id: ID; createdAt: ISODateTime; }

/* ---------- Educação e gamificação ---------- */

export type LessonTopic =
  | 'basics' | 'type1' | 'type2' | 'glucose' | 'carbs' | 'hypo' | 'hyper'
  | 'exercise' | 'sleep' | 'food' | 'insulin' | 'meds' | 'feet' | 'travel'
  | 'school' | 'work' | 'appointment' | 'exams' | 'records';

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface LessonCard {
  title: string;
  /** Parágrafos curtos. */
  body: string[];
  /** Versão com linguagem simples para o modo criança (opcional). */
  bodyChild?: string[];
  keyPoint?: string;
}

export interface LearningModule {
  id: ID;
  topic: LessonTopic;
  title: string;
  titleChild?: string;
  summary: string;
  minutes: number;
  level: 'básico' | 'hábitos' | 'rotina' | 'cuidados';
  tone: Tone;
  cards: LessonCard[];
  quiz: QuizQuestion[];
}

export interface LearningProgress {
  id: ID; // = moduleId
  moduleId: ID;
  completedAt?: ISODateTime;
  quizScore?: number;
  lastCard: number;
  updatedAt: ISODateTime;
}

export interface AchievementUnlock {
  id: ID; // = achievementId
  unlockedAt: ISODateTime;
}

/* ---------- Emergência ---------- */

export interface EmergencyContact { name: string; relation?: string; phone: string; }

export interface EmergencyProfile {
  id: 'emergency';
  showName: boolean;
  name?: string;
  diabetesType: DiabetesType;
  importantMeds: string;
  allergies?: string;
  contacts: EmergencyContact[];
  notes?: string;
  updatedAt: ISODateTime;
}

/* ---------- Cuidador (arquitetura futura) ---------- */

export type ShareCategory = 'glucose' | 'meals' | 'insulin' | 'medications' | 'activity' | 'mood' | 'exams' | 'appointments' | 'emergency';

/** Compartilhamento sempre explícito, por categoria e com validade. Nada é compartilhado por padrão. */
export interface CaregiverPermission extends BaseRecord {
  caregiverName: string;
  caregiverEmail?: string;
  categories: ShareCategory[];
  access: 'read';
  expiresAt?: ISODateTime | null;
  status: 'invited' | 'active' | 'revoked';
}

/* ---------- Utilitários de UI ---------- */

export type Tone = 'blue' | 'green' | 'teal' | 'amber' | 'rose' | 'violet' | 'gray';

/** Tipos de registro que o usuário pode criar pela folha "Registrar". */
export type QuickKind = 'glucose' | 'meal' | 'insulin' | 'medication' | 'activity' | 'mood' | 'event';
