/* =========================================================
   Gera o PDF "Resumo para consulta" no próprio aparelho.
   Usa pdf-lib (sem servidor). Fontes padrão Helvetica
   (WinAnsi), que cobrem os acentos do português.
   ========================================================= */
import type { PDFFont, PDFPage, RGB } from 'pdf-lib';
import type { ReportData } from '@/features/reports/reportData';
import type { GlucoseTargetRange, GlucoseUnit, MoodLevel, UserProfile } from '@/types/models';
import { APP_CONFIG } from '@/config/app.config';
import { CONTEXT_LABEL, formatGlucose, TREND_LABEL } from '@/utils/glucose';
import { EVIDENCE_META, INDICATOR_META, INSULIN_KIND_LABEL, INSULIN_MOMENT_LABEL, MEAL_LABEL, MOOD_META } from '@/config/categories';
import { fmtDateLong, fmtDateShort, fmtDateTime, parseLocalDate } from '@/utils/date';
import { ageFrom, bmi, fmtKg, fmtNum1 } from '@/utils/body';
import { DIABETES_TYPE_LABEL } from '@/config/categories';
import { sortPlan } from '@/features/insulin/InsulinPlan';

const WINANSI_EXTRA = '€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ';
function safe(s: string): string {
  return s
    .replace(/²/g, '2').replace(/→/g, '->').replace(/≤/g, '<=').replace(/≥/g, '>=').replace(/[   ]/g, ' ')
    .split('').map((c) => (c.charCodeAt(0) < 256 || WINANSI_EXTRA.includes(c) ? c : '?')).join('');
}

export interface PdfOptions { profile: UserProfile | null; unit: GlucoseUnit; range: GlucoseTargetRange | null; }

export async function buildReportPdf(r: ReportData, opts: PdfOptions): Promise<Blob> {
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
  const doc = await PDFDocument.create();
  doc.setTitle(`Resumo para consulta — ${opts.profile?.name || APP_CONFIG.name}`);
  doc.setAuthor(APP_CONFIG.name);
  doc.setCreator(APP_CONFIG.name);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const C = {
    ink: rgb(0.12, 0.18, 0.24), muted: rgb(0.44, 0.5, 0.59), line: rgb(0.88, 0.91, 0.94),
    blue: rgb(0.247, 0.435, 0.898), blueSoft: rgb(0.933, 0.953, 1), green: rgb(0.3, 0.66, 0.45), greenSoft: rgb(0.93, 0.97, 0.945),
    amber: rgb(0.9, 0.635, 0.294), amberSoft: rgb(1, 0.96, 0.91), amberInk: rgb(0.55, 0.36, 0.08),
  };
  const W = 595.28, H = 841.89, M = 42, CW = W - 2 * M;
  let page: PDFPage = doc.addPage([W, H]);
  let y = H - M;

  const newPage = () => { page = doc.addPage([W, H]); y = H - M; };
  const ensure = (h: number) => { if (y - h < M + 24) newPage(); };

  const wrap = (text: string, f: PDFFont, size: number, width: number): string[] => {
    const out: string[] = [];
    for (const para of safe(text).split('\n')) {
      let line = '';
      for (const word of para.split(' ')) {
        const test = line ? `${line} ${word}` : word;
        if (f.widthOfTextAtSize(test, size) > width && line) { out.push(line); line = word; } else line = test;
      }
      out.push(line);
    }
    return out;
  };
  const text = (t: string, o: { size?: number; f?: PDFFont; color?: RGB; x?: number; width?: number; gap?: number } = {}) => {
    const size = o.size ?? 10, f = o.f ?? font, lh = size * 1.35;
    for (const l of wrap(t, f, size, o.width ?? CW - ((o.x ?? M) - M))) {
      ensure(lh);
      page.drawText(l, { x: o.x ?? M, y: y - size, size, font: f, color: o.color ?? C.ink });
      y -= lh;
    }
    y -= o.gap ?? 0;
  };
  const section = (title: string) => {
    ensure(40);
    y -= 10;
    page.drawText(safe(title), { x: M, y: y - 13, size: 13, font: bold, color: C.blue });
    y -= 20;
    page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 0.8, color: C.line });
    y -= 8;
  };
  const box = (t: string, fill: RGB, color: RGB) => {
    const lines = wrap(t, font, 9, CW - 20);
    const h = lines.length * 12.5 + 12;
    ensure(h + 6);
    page.drawRectangle({ x: M, y: y - h, width: CW, height: h, color: fill });
    lines.forEach((l, i) => page.drawText(l, { x: M + 10, y: y - 16 - i * 12.5, size: 9, font, color }));
    y -= h + 8;
  };
  /** Grade de "cartões" com número grande e rótulo. */
  const stats = (items: { v: string; l: string }[], cols = 3) => {
    const gw = (CW - (cols - 1) * 8) / cols, gh = 42;
    for (let i = 0; i < items.length; i += cols) {
      ensure(gh + 8);
      items.slice(i, i + cols).forEach((it, j) => {
        const x = M + j * (gw + 8);
        page.drawRectangle({ x, y: y - gh, width: gw, height: gh, borderColor: C.line, borderWidth: 0.8, color: rgb(1, 1, 1) });
        page.drawText(safe(it.v), { x: x + 8, y: y - 20, size: 14, font: bold, color: C.ink });
        page.drawText(safe(it.l), { x: x + 8, y: y - 34, size: 8, font, color: C.muted });
      });
      y -= gh + 8;
    }
  };
  const table = (head: string[], rows: string[][], widths: number[], alignRight: number[] = []) => {
    const draw = (cells: string[], f: PDFFont, color: RGB) => {
      const lines = cells.map((c, i) => wrap(c, f, 9, widths[i] * CW - 12));
      const h = Math.max(...lines.map((l) => l.length)) * 12 + 6;
      ensure(h);
      let x = M;
      lines.forEach((ls, i) => {
        ls.forEach((l, k) => {
          const w = f.widthOfTextAtSize(l, 9);
          page.drawText(l, { x: alignRight.includes(i) ? x + widths[i] * CW - w - 4 : x + (i ? 8 : 0), y: y - 11 - k * 12, size: 9, font: f, color });
        });
        x += widths[i] * CW;
      });
      y -= h;
      page.drawLine({ start: { x: M, y: y + 2 }, end: { x: W - M, y: y + 2 }, thickness: 0.5, color: C.line });
    };
    ensure(40); // não deixa o cabeçalho sozinho no fim da página
    draw(head, bold, C.muted);
    rows.forEach((row) => draw(row, font, C.ink));
    y -= 6;
  };

  const { unit, range, profile } = opts;
  const g = (v: number | null) => (v == null ? '—' : formatGlucose(v, unit));

  /* ---------- Cabeçalho ---------- */
  page.drawRectangle({ x: 0, y: H - 6, width: W, height: 6, color: C.blue });
  text(`RESUMO PARA CONSULTA · ${APP_CONFIG.name.toUpperCase()}`, { size: 8, f: bold, color: C.muted });
  y -= 2;
  text(profile?.name || 'Meus registros', { size: 20, f: bold });
  text(`Período: ${fmtDateLong(r.from)} a ${fmtDateLong(r.to)}`, { size: 10, color: C.muted, gap: 4 });

  const age = ageFrom(profile);
  const lw = r.lastWeight;
  const imc = lw ? bmi(lw.weightKg, profile?.heightCm) : null;
  const ident = [
    profile?.diabetesType && profile.diabetesType !== 'unspecified' ? DIABETES_TYPE_LABEL[profile.diabetesType] : null,
    age != null ? `${age} anos` : null,
    profile?.heightCm ? `${profile.heightCm} cm` : null,
    lw ? `${fmtKg(lw.weightKg)} kg (${fmtDateShort(lw.at)})` : null,
    imc ? `IMC ${fmtNum1(imc)}` : null,
  ].filter(Boolean).join('  ·  ');
  if (ident) text(ident, { size: 10, gap: 4 });
  if (r.hasDemo) box('Atenção: este resumo contém dados de demonstração, que não são registros reais.', C.amberSoft, C.amberInk);

  /* ---------- Glicose ---------- */
  section('Glicose');
  stats([
    { v: g(r.stats.avg), l: `Média (${unit})` }, { v: g(r.stats.min), l: 'Mínimo' }, { v: g(r.stats.max), l: 'Máximo' },
    { v: String(r.stats.count), l: 'Medições' }, { v: String(r.stats.daysWithRecords), l: 'Dias com registro' }, { v: TREND_LABEL[r.stats.trend], l: 'Tendência' },
  ]);
  if (r.glucose.length) {
    // Gráfico de pontos com faixa configurada
    const ch = 150; ensure(ch + 30);
    const x0 = M + 30, x1 = W - M, yTop = y - 6, yBot = y - ch;
    const vals = r.glucose.map((p) => p.valueMgdl);
    const lo = Math.max(0, Math.floor((Math.min(...vals, range?.lowMgdl ?? 999) - 20) / 50) * 50);
    const hi = Math.ceil((Math.max(...vals, range?.highMgdl ?? 0) + 20) / 50) * 50;
    const t0 = r.from.getTime(), t1 = r.to.getTime();
    const px = (iso: string) => x0 + ((new Date(iso).getTime() - t0) / (t1 - t0)) * (x1 - x0);
    const py = (v: number) => yBot + ((v - lo) / (hi - lo || 1)) * (yTop - yBot);
    if (range) page.drawRectangle({ x: x0, y: py(range.lowMgdl), width: x1 - x0, height: py(range.highMgdl) - py(range.lowMgdl), color: C.greenSoft });
    for (let v = lo; v <= hi; v += hi - lo > 250 ? 100 : 50) {
      page.drawLine({ start: { x: x0, y: py(v) }, end: { x: x1, y: py(v) }, thickness: 0.4, color: C.line });
      const lbl = formatGlucose(v, unit);
      page.drawText(lbl, { x: x0 - 6 - font.widthOfTextAtSize(lbl, 7), y: py(v) - 2.5, size: 7, font, color: C.muted });
    }
    for (const p of r.glucose) {
      const out = range && (p.valueMgdl < range.lowMgdl || p.valueMgdl > range.highMgdl);
      page.drawCircle({ x: px(p.at), y: py(p.valueMgdl), size: r.glucose.length > 80 ? 1.6 : 2.4, color: out ? C.amber : C.blue });
    }
    [0, 0.5, 1].forEach((f) => {
      const d = new Date(t0 + (t1 - t0) * f);
      const lbl = fmtDateShort(d);
      const w = font.widthOfTextAtSize(lbl, 7);
      page.drawText(lbl, { x: f === 0 ? x0 : f === 1 ? x1 - w : (x0 + x1) / 2 - w / 2, y: yBot - 12, size: 7, font, color: C.muted });
    });
    y = yBot - 20;
    if (range) text(`Faixa definida ${range.definedBy === 'professional' ? 'pelo profissional' : 'pela pessoa'}: ${formatGlucose(range.lowMgdl, unit)}–${formatGlucose(range.highMgdl, unit)} ${unit}. Dentro: ${Math.round(r.stats.inRange ?? 0)}% · abaixo: ${Math.round(r.stats.below ?? 0)}% · acima: ${Math.round(r.stats.above ?? 0)}% das medições registradas.`, { size: 9, color: C.muted, gap: 4 });
    else text('Faixa de glicose não definida no app.', { size: 9, color: C.muted, gap: 4 });
  }
  if (r.byContext.length) table(['Momento', 'Medições', 'Média', 'Mín.–Máx.'], r.byContext.map((c) => [CONTEXT_LABEL[c.context], String(c.count), g(c.avg), `${g(c.min)}–${g(c.max)}`]), [0.4, 0.2, 0.2, 0.2], [1, 2, 3]);
  if (r.glucose.length && r.glucose.length <= 40) {
    text('Medições do período', { size: 10, f: bold, gap: 2 });
    table(['Data e hora', 'Valor', 'Momento', 'Observação'], [...r.glucose].reverse().map((x) => [fmtDateTime(x.at), `${formatGlucose(x.valueMgdl, unit)} ${unit}`, CONTEXT_LABEL[x.context], x.note ?? '']), [0.25, 0.17, 0.25, 0.33], [1]);
  }

  /* ---------- Insulina e medicamentos ---------- */
  section('Insulina e medicamentos');
  if (r.plan.length) {
    text('Esquema de insulina cadastrado' + (r.plan.some((p) => !p.confirmed) ? ' (* a conferir na receita original)' : ''), { size: 10, f: bold, gap: 2 });
    table(['Momento', 'Insulina', 'Tipo', 'Dose'], sortPlan(r.plan).map((p) => [INSULIN_MOMENT_LABEL[p.moment] + (p.time ? ` (${p.time})` : ''), `${p.name}${p.concentration ? ' ' + p.concentration : ''}`, INSULIN_KIND_LABEL[p.kind], `${String(p.doseUnits).replace('.', ',')} UI${p.confirmed ? '' : ' *'}`]), [0.3, 0.3, 0.2, 0.2], [3]);
  }
  text(r.insulin.length
    ? `Aplicações de insulina registradas: ${r.insulin.length} (${r.insulin.filter((i) => i.kind === 'basal').length} basal, ${r.insulin.filter((i) => i.kind === 'bolus').length} bolus).`
    : 'Nenhuma aplicação de insulina registrada no período.', { size: 10, gap: 4 });
  if (r.medSummary.length) table(['Medicamento', 'Dose e horários', 'Registros no período'], r.medSummary.map((m) => [m.med.name, `${m.med.dose}${m.med.times.length ? ' · ' + m.med.times.join(', ') : ''}`, `${m.taken} tomados · ${m.postponed} adiados · ${m.notTaken} não tomados`]), [0.3, 0.35, 0.35]);

  /* ---------- Peso e rotina ---------- */
  section('Peso, alimentação e atividade');
  stats([
    { v: lw ? `${fmtKg(lw.weightKg)} kg` : '—', l: 'Último peso' },
    { v: r.weights.length >= 2 ? `${r.weights[r.weights.length - 1].weightKg - r.weights[0].weightKg > 0 ? '+' : ''}${fmtKg(r.weights[r.weights.length - 1].weightKg - r.weights[0].weightKg)} kg` : '—', l: 'Variação no período' },
    { v: imc ? fmtNum1(imc) : '—', l: 'IMC' },
    { v: String(r.meals.length), l: 'Refeições registradas' }, { v: String(r.acts.length), l: 'Atividades físicas' }, { v: `${r.activityMinutes} min`, l: 'Tempo de atividade' },
  ]);
  if (r.meals.length) {
    text('Refeições recentes', { size: 10, f: bold, gap: 2 });
    r.meals.slice(-6).reverse().forEach((m) => text(`${fmtDateTime(m.at)} · ${MEAL_LABEL[m.mealType]}: ${m.description}${m.carbsGrams != null ? ` (${m.carbsGrams} g carb.)` : ''}`, { size: 9 }));
    y -= 4;
  }

  /* ---------- Sintomas ---------- */
  if (r.moods.length) {
    section('Como estou e sintomas');
    text([...r.moodCount.entries()].map(([k, n]) => `${MOOD_META[k as MoodLevel].label}: ${n}`).join('  ·  '), { size: 10, gap: 2 });
    if (r.symptoms.length) text(`Sintomas registrados: ${r.symptoms.map(([s, n]) => `${s} (${n}x)`).join(', ')}.`, { size: 10 });
  }

  /* ---------- Exames ---------- */
  section('Exames');
  if (r.latestResults.length) {
    table(['Exame', 'Resultado', 'Data', 'Situação'], r.latestResults.map((x) => [
      x.indicator === 'other' ? x.customName ?? 'Outro' : INDICATOR_META[x.indicator].label,
      `${String(x.value).replace('.', ',')} ${x.unit}`, fmtDateLong(parseLocalDate(x.date)),
      x.verified === false ? 'Transcrito — verificar laudo' : 'Conferido',
    ]), [0.32, 0.26, 0.22, 0.2], [1]);
  } else text('Nenhum resultado de exame registrado.', { size: 10, color: C.muted });

  /* ---------- Histórico ---------- */
  const notes = profile?.historyNotes ?? [];
  if (notes.length) {
    section('Histórico informado (relatos, não são laudos)');
    for (const n of notes) {
      text(`${n.title}${n.when ? ` — ${n.when}` : ''}  [${EVIDENCE_META[n.evidence].label}]`, { size: 10, f: bold });
      text(n.text, { size: 9, gap: 4 });
    }
  }
  if (r.notes.length) {
    section('Observações do período');
    r.notes.slice(0, 12).forEach((n) => text(`${fmtDateTime(n.at)} · ${n.kind}: ${n.text}`, { size: 9 }));
  }

  /* ---------- Perguntas ---------- */
  if (r.questions.length) {
    section('Perguntas para o médico');
    r.questions.forEach((q, i) => text(`${i + 1}. ${q.text}`, { size: 10, gap: 2 }));
  }

  y -= 8;
  box(`${APP_CONFIG.medicalDisclaimer} Resumo gerado em ${fmtDateTime(new Date().toISOString())} a partir dos registros feitos no app.`, C.blueSoft, C.ink);

  /* ---------- Rodapé com paginação ---------- */
  const pages = doc.getPages();
  pages.forEach((p, i) => {
    const t = safe(`${profile?.name || APP_CONFIG.name} · Resumo para consulta · página ${i + 1} de ${pages.length}`);
    p.drawText(t, { x: M, y: 22, size: 7.5, font, color: C.muted });
  });

  const bytes = await doc.save();
  return new Blob([bytes as BlobPart], { type: 'application/pdf' });
}
