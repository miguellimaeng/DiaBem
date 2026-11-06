/* Peso e medidas — idade, altura, peso ao longo do tempo e IMC (apenas o número). */
import { useState } from 'react';
import { useApp } from '@/app/AppContext';
import { useData } from '@/app/useData';
import { back } from '@/app/router';
import { repo } from '@/database/repositories';
import { Button, Card, DemoTag, Empty, Notice, Pills, Section, Stat, SubHead, TextField } from '@/components/ui';
import { RecordSheet } from '@/components/ui/RecordSheet';
import { TrendLine } from '@/components/charts/SimpleCharts';
import { Icon } from '@/components/Icon';
import { ageFrom, bmi, fmtKg, fmtNum1, weightChange } from '@/utils/body';
import { fmtDateShort, fmtDateTime, toLocalDateInput } from '@/utils/date';

export function BodyPage() {
  const { profile, openQuick, mode } = useApp();
  const [editOpen, setEditOpen] = useState(false);
  const [range, setRange] = useState<'30' | '90' | '365'>('90');
  const { data: weights } = useData(() => repo.weights.all(), [], ['weights']);
  const sorted = [...(weights ?? [])].sort((a, b) => a.at.localeCompare(b.at));
  const last = sorted[sorted.length - 1];
  const age = ageFrom(profile);
  const imc = bmi(last?.weightKg, profile?.heightCm);
  const ch30 = weightChange(sorted, 30);
  const ch90 = weightChange(sorted, 90);
  const cutoff = Date.now() - Number(range) * 86400000;
  const inRange = sorted.filter((w) => new Date(w.at).getTime() >= cutoff);
  const chartPts = inRange.slice(-12).map((w) => ({ date: toLocalDateInput(new Date(w.at)), value: Math.round(w.weightKg * 10) / 10 }));

  return (
    <div>
      <SubHead title="Peso e medidas" subtitle="Idade, altura e evolução do peso" onBack={() => back('/saude')}
        action={<Button small icon="plus" onClick={() => openQuick('weight')}>Peso</Button>} />

      <Card title="Meus dados" action="Editar" onAction={() => setEditOpen(true)}>
        <div className="grid-3">
          <Stat value={age ?? '—'} unit={age != null ? 'anos' : undefined} label="Idade" />
          <Stat value={profile?.heightCm ? String(profile.heightCm) : '—'} unit={profile?.heightCm ? 'cm' : undefined} label="Altura" />
          <Stat value={last ? fmtKg(last.weightKg) : '—'} unit={last ? 'kg' : undefined} label="Peso atual" />
        </div>
        {(!profile?.heightCm || age == null) && (
          <button className="btn btn-sm btn-soft mt-3" onClick={() => setEditOpen(true)}>Informar {age == null ? 'data de nascimento' : ''}{age == null && !profile?.heightCm ? ' e ' : ''}{!profile?.heightCm ? 'altura' : ''}</button>
        )}
      </Card>

      {last ? (
        <>
          <Section title="Análise" />
          <div className="grid-3">
            {mode !== 'child' && <Stat value={imc ? fmtNum1(imc) : '—'} label={imc ? 'IMC' : 'IMC (informe a altura)'} />}
            <Stat value={ch30 ? `${ch30.delta > 0 ? '+' : ''}${fmtKg(ch30.delta)}` : '—'} unit={ch30 ? 'kg' : undefined} label="Variação em 30 dias" />
            <Stat value={ch90 ? `${ch90.delta > 0 ? '+' : ''}${fmtKg(ch90.delta)}` : '—'} unit={ch90 ? 'kg' : undefined} label="Variação em 90 dias" />
          </div>
          <div className="mt-3">
            {mode === 'child'
              ? <Notice tone="neutral">Em crianças e adolescentes, o peso é avaliado pelo pediatra com curvas de crescimento.</Notice>
              : <Notice tone="neutral">O IMC (peso ÷ altura²) é só uma referência geral. Em pessoas idosas, atletas, gestantes e crianças a interpretação é diferente — converse com sua equipe sobre o que ele significa para você.</Notice>}
          </div>

          <Section title="Evolução" />
          <Card>
            <Pills label="Período" value={range} onChange={setRange} options={[{ value: '30', label: '30 dias' }, { value: '90', label: '90 dias' }, { value: '365', label: '1 ano' }]} />
            <div className="mt-3">
              {chartPts.length >= 2 ? <TrendLine points={chartPts} unit="kg" color="var(--teal)" /> : <p className="small muted">Com dois ou mais registros no período, o gráfico aparece aqui.</p>}
            </div>
            {inRange.length > 12 && <p className="xsmall muted mt-2">Mostrando os 12 registros mais recentes do período.</p>}
          </Card>

          <Section title="Registros" />
          <Card className="tight">
            <div className="list">
              {[...sorted].reverse().slice(0, 15).map((w) => (
                <button key={w.id} className="list-item list-btn" onClick={() => openQuick('weight', { editId: w.id })}>
                  <span className="cat sm tone-teal"><Icon name="scale" size={16} /></span>
                  <div className="grow"><div className="title row" style={{ gap: 6 }}>{fmtKg(w.weightKg)} kg{w.isDemo && <DemoTag />}</div><div className="sub">{fmtDateTime(w.at)}{w.note ? ` · ${w.note}` : ''}</div></div>
                  <Icon name="chevronRight" size={16} />
                </button>
              ))}
            </div>
          </Card>
        </>
      ) : (
        <Card className="mt-3"><Empty icon="scale" tone="teal" title="Nenhum peso registrado" text="Registre seu peso de vez em quando — por exemplo, uma vez por semana — para acompanhar a evolução." action={<Button icon="plus" onClick={() => openQuick('weight')}>Registrar peso</Button>} /></Card>
      )}
      <p className="disclaimer">Os números são descritivos. Metas de peso e interpretação devem ser definidas com sua equipe de saúde.</p>
      {editOpen && <BodyDataEditor onDone={() => setEditOpen(false)} />}
    </div>
  );
}

export function BodyDataEditor({ onDone }: { onDone: () => void }) {
  const { profile, saveProfile, toast } = useApp();
  const [birth, setBirth] = useState(profile?.birthDate ?? '');
  const [height, setHeight] = useState(profile?.heightCm ? String(profile.heightCm) : '');
  const h = Number(height.replace(',', '.'));
  const validH = height === '' || (h >= 40 && h <= 250);
  const validB = birth === '' || (new Date(birth) < new Date() && new Date(birth).getFullYear() > 1900);

  return (
    <RecordSheet title="Meus dados" onClose={onDone} canSave={validH && validB} onSave={async () => {
      await saveProfile({ birthDate: birth || undefined, heightCm: height ? Math.round(h) : undefined });
      toast('Dados salvos'); onDone();
    }}>
      <TextField label="Data de nascimento" type="date" value={birth} onChange={setBirth} hint={birth ? `${fmtDateShort(birth + 'T12:00')} · usada só para calcular a idade` : 'Usada só para calcular a idade.'} />
      <TextField label="Altura (cm)" value={height} onChange={(v) => setHeight(v.replace(/[^0-9.,]/g, ''))} inputMode="decimal" placeholder="Ex.: 160" />
      {!validH && <p className="small" style={{ color: 'var(--amber-ink)' }}>Informe a altura em centímetros (ex.: 160).</p>}
    </RecordSheet>
  );
}
