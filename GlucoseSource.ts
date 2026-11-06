/* =========================================================
   Integrações futuras de glicose (não implementadas).
   Cada fonte converte leituras para GlucoseRecord com
   `source` próprio, e o restante do app funciona igual.
   ========================================================= */
import type { GlucoseRecord, RecordSource } from '@/types/models';

export interface GlucoseReading { at: string; valueMgdl: number; trendArrow?: 'up' | 'down' | 'flat'; }

export interface GlucoseSource {
  readonly id: RecordSource;
  readonly label: string;
  readonly kind: 'cgm' | 'meter' | 'health-platform';
  isAvailable(): Promise<boolean>;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  /** Leituras desde uma data. A importação é sempre iniciada/aceita pelo usuário. */
  fetchSince(sinceISO: string): Promise<GlucoseReading[]>;
}

export function readingToRecord(r: GlucoseReading, source: RecordSource): Omit<GlucoseRecord, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'> {
  return { at: r.at, valueMgdl: r.valueMgdl, enteredUnit: 'mg/dL', enteredValue: r.valueMgdl, context: 'other', source };
}

/** Catálogo exibido nas configurações como "em breve". */
export const PLANNED_SOURCES: { id: RecordSource; label: string; kind: GlucoseSource['kind'] }[] = [
  { id: 'dexcom', label: 'Dexcom (CGM)', kind: 'cgm' },
  { id: 'libre', label: 'FreeStyle Libre (CGM)', kind: 'cgm' },
  { id: 'bluetooth-meter', label: 'Glicosímetro Bluetooth', kind: 'meter' },
  { id: 'apple-health', label: 'Apple Saúde', kind: 'health-platform' },
  { id: 'health-connect', label: 'Google Health Connect', kind: 'health-platform' },
];
