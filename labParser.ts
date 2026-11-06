/* =========================================================
   Extrator de indicadores a partir do TEXTO de um laudo.
   Heurístico e conservador: só propõe valores; a pessoa
   sempre confere e confirma antes de salvar.
   Não interpreta resultados.
   ========================================================= */
import type { ExamIndicator } from '@/types/models';

export interface ParsedResult {
  indicator: ExamIndicator;
  customName?: string;
  value: number;
  unit: string;
  /** Linha do laudo de onde veio — exibida para conferência. */
  source: string;
  labReference?: string;
}

export interface ParsedLab {
  date?: string;      // AAAA-MM-DD
  lab?: string;
  results: ParsedResult[];
  textLength: number;
}

interface Rule {
  indicator: ExamIndicator;
  customName?: string;
  /** Nomes como aparecem em laudos brasileiros (sem acento, minúsculo). */
  names: RegExp;
  /** Linhas que contêm estes termos não são este exame. */
  exclude?: RegExp;
  units: RegExp;
  defaultUnit: string;
  min: number;
  max: number;
}

const U_MGDL = /mg\s*\/\s*dl/i;
const RULES: Rule[] = [
  { indicator: 'hba1c', names: /(hemoglobina\s+glicada|hemoglobina\s+glicosilada|hb\s*a\s*1\s*c|a1c)/, exclude: /glicose\s+media|media\s+estimada|\bgme\b|mmol\/mol/, units: /%/, defaultUnit: '%', min: 3, max: 20 },
  { indicator: 'fasting_glucose', names: /(glicose|glicemia)(\s+de)?(\s+em)?\s*(jejum)?/, exclude: /media|estimada|pos|apos|prandial|curva|tolerancia|urina|hemoglobina|60\s*min|120\s*min|2\s*h/, units: U_MGDL, defaultUnit: 'mg/dL', min: 20, max: 800 },
  { indicator: 'ldl', names: /\bldl\b|colesterol\s+ldl|ldl[\s-]*colesterol/, exclude: /nao\s*hdl|vldl/, units: U_MGDL, defaultUnit: 'mg/dL', min: 10, max: 500 },
  { indicator: 'hdl', names: /\bhdl\b|colesterol\s+hdl|hdl[\s-]*colesterol/, exclude: /nao\s*hdl|nao-hdl/, units: U_MGDL, defaultUnit: 'mg/dL', min: 5, max: 200 },
  { indicator: 'total_cholesterol', names: /colesterol\s+total/, units: U_MGDL, defaultUnit: 'mg/dL', min: 50, max: 700 },
  { indicator: 'triglycerides', names: /triglicer[ií]?d(e|i)os?|triglicerides|triglicer/, units: U_MGDL, defaultUnit: 'mg/dL', min: 10, max: 5000 },
  { indicator: 'egfr', names: /(e?tfg|taxa\s+de\s+filtracao|filtracao\s+glomerular|ckd[\s-]*epi|rfg)/, units: /ml\s*\/\s*min/i, defaultUnit: 'mL/min/1,73 m²', min: 3, max: 200 },
  { indicator: 'creatinine', names: /\bcreatinina\b/, exclude: /urina|clearance|depuracao|albumina|relacao|filtracao|tfg/, units: U_MGDL, defaultUnit: 'mg/dL', min: 0.1, max: 20 },
  { indicator: 'microalbuminuria', names: /(microalbumin|albumina\s+urinaria|relacao\s+albumina|albumina\s*\/\s*creatinina|rac\b)/, units: /mg\s*\/\s*g|mg\s*\/\s*l|mg\s*\/\s*24/i, defaultUnit: 'mg/g', min: 0, max: 5000 },
  { indicator: 'sodium', names: /\bsodio\b/, exclude: /urina/, units: /meq\s*\/\s*l|mmol\s*\/\s*l/i, defaultUnit: 'mEq/L', min: 100, max: 180 },
  { indicator: 'potassium', names: /\bpotassio\b/, exclude: /urina/, units: /meq\s*\/\s*l|mmol\s*\/\s*l/i, defaultUnit: 'mEq/L', min: 1.5, max: 9 },
  { indicator: 'other', customName: 'TSH', names: /\btsh\b/, units: /[µu]\s*ui\s*\/\s*ml|mui\s*\/\s*l/i, defaultUnit: 'µUI/mL', min: 0.01, max: 100 },
  { indicator: 'other', customName: 'Ácido úrico', names: /acido\s+urico/, exclude: /urina/, units: U_MGDL, defaultUnit: 'mg/dL', min: 0.5, max: 20 },
  { indicator: 'other', customName: 'Ureia', names: /\bureia\b/, exclude: /urina/, units: U_MGDL, defaultUnit: 'mg/dL', min: 2, max: 400 },
];

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** "1.234,5" | "8,5" | "8.5" → número */
function toNumber(raw: string): number {
  let s = raw.trim();
  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) s = s.replace(/\./g, '').replace(',', '.');
  else s = s.replace(',', '.');
  return Number(s);
}

const NUM = /(?<![\d/.,])(\d{1,4}(?:[.,]\d{1,3})?)(?![\d/])/g;
const REF_WORDS = /(refer[eê]ncia|valores?\s+de\s+ref|ref\.|desej[aá]vel|[oó]timo|limítrofe|limitrofe|at[eé]\s|inferior\s+a|superior\s+a|maior\s+que|menor\s+que|acima\s+de|abaixo\s+de|normal|adultos?:|alto\s*risco|risco)/i;

function findValue(line: string, after: number, rule: Rule, next: string[] = []): { value: number; unit: string; refPart?: string } | null {
  const tryText = (txt: string, offset: number) => {
    const refIdx = txt.search(REF_WORDS);
    NUM.lastIndex = offset;
    let m: RegExpExecArray | null;
    while ((m = NUM.exec(txt))) {
      if (refIdx >= 0 && m.index > refIdx) break; // números depois de "referência" são faixa, não resultado
      const before = txt.slice(Math.max(0, m.index - 3), m.index);
      if (/[<>≤≥]\s*$/.test(before)) continue;
      const v = toNumber(m[1]);
      if (!Number.isFinite(v) || v < rule.min || v > rule.max) continue;
      const tail = txt.slice(m.index + m[0].length, m.index + m[0].length + 20);
      const um = tail.match(rule.units);
      const unit = um && tail.indexOf(um[0]) < 6 ? normalizeUnit(um[0], rule.defaultUnit) : rule.defaultUnit;
      return { value: v, unit, refPart: refIdx >= 0 ? txt.slice(refIdx).trim().slice(0, 80) : undefined };
    }
    return null;
  };
  const first = tryText(line, after);
  if (first) return first;
  // resultado na(s) linha(s) seguinte(s), desde que não comece outro exame
  for (const n of next) {
    if (RULES.some((r) => r !== rule && r.names.test(fold(n)))) break;
    const hit = tryText(n, 0);
    if (hit) return hit;
  }
  return null;
}

function normalizeUnit(u: string, fallback: string) {
  const f = fold(u).replace(/\s+/g, '');
  if (f === '%') return '%';
  if (f.startsWith('mg/dl')) return 'mg/dL';
  if (f.startsWith('meq/l')) return 'mEq/L';
  if (f.startsWith('mmol/l')) return 'mmol/L';
  if (f.startsWith('mg/g')) return 'mg/g';
  if (f.startsWith('mg/l')) return 'mg/L';
  if (f.startsWith('ml/min')) return 'mL/min/1,73 m²';
  return fallback;
}

export function parseDate(text: string): string | undefined {
  const t = fold(text);
  const pick = (d: string, m: string, y: string) => {
    const yy = y.length === 2 ? `20${y}` : y;
    const iso = `${yy}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    const dt = new Date(iso + 'T12:00:00');
    return Number.isNaN(dt.getTime()) || dt.getTime() > Date.now() + 86400000 || Number(yy) < 1990 ? undefined : iso;
  };
  const labeled = t.match(/(data\s+(da\s+|de\s+)?coleta|coletad[oa]\s+em|coleta|data\s+do\s+exame|data\s+de\s+atendimento|atendimento)[^\d]{0,20}(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})/);
  if (labeled) return pick(labeled[3], labeled[4], labeled[5]);
  const any = t.match(/(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/);
  return any ? pick(any[1], any[2], any[3]) : undefined;
}

export function parseLabText(text: string): ParsedLab {
  const lines = text.split(/\r?\n/).map((l) => l.replace(/\s+/g, ' ').trim()).filter(Boolean);
  const results: ParsedResult[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const f = fold(raw);
    for (const rule of RULES) {
      const key = rule.indicator + (rule.customName ?? '');
      if (seen.has(key)) continue;
      const m = f.match(rule.names);
      if (!m || m.index == null) continue;
      if (rule.exclude && rule.exclude.test(f)) continue;
      // fold() preserva o tamanho no texto em português; usamos o mesmo índice
      const hit = findValue(raw, m.index + m[0].length, rule, lines.slice(i + 1, i + 3));
      if (!hit) continue;
      seen.add(key);
      results.push({ indicator: rule.indicator, customName: rule.customName, value: hit.value, unit: hit.unit, source: raw.slice(0, 140), labReference: hit.refPart });
      break; // uma linha → um indicador
    }
  }
  const header = lines.slice(0, 6).find((l) => /laborat[oó]rio|diagn[oó]stic|an[aá]lises\s+cl[ií]nicas|medicina\s+diagn/i.test(l));
  return { date: parseDate(text), lab: header?.slice(0, 60), results, textLength: text.length };
}
