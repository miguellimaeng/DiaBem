/* Faixa da glicose — sempre definida pelo usuário ou profissional. */
import { useState } from 'react';
import { useApp } from '@/app/AppContext';
import { Button, Notice, Segmented, Sheet, TextField } from '@/components/ui';
import { formatGlucose, INPUT_LIMITS, toMgdl } from '@/utils/glucose';
import { nowISO } from '@/utils/date';

export function RangeEditor({ onClose }: { onClose: () => void }) {
  const { settings, updateSettings, toast } = useApp();
  const unit = settings.glucoseUnit;
  const cur = settings.targetRange;
  const [low, setLow] = useState(cur ? formatGlucose(cur.lowMgdl, unit) : '');
  const [high, setHigh] = useState(cur ? formatGlucose(cur.highMgdl, unit) : '');
  const [by, setBy] = useState<'user' | 'professional'>(cur?.definedBy ?? 'professional');

  const lim = INPUT_LIMITS[unit];
  const lo = Number(low.replace(',', '.'));
  const hi = Number(high.replace(',', '.'));
  const valid = low !== '' && high !== '' && lo >= lim.min && hi <= lim.max && lo < hi;

  async function save() {
    await updateSettings({ targetRange: { lowMgdl: Math.round(toMgdl(lo, unit)), highMgdl: Math.round(toMgdl(hi, unit)), definedBy: by, updatedAt: nowISO() } });
    toast('Faixa salva');
    onClose();
  }

  return (
    <Sheet open title="Minha faixa de glicose" onClose={onClose}
      footer={<>
        {cur && <Button variant="ghost" onClick={async () => { await updateSettings({ targetRange: null }); toast('Faixa removida'); onClose(); }}>Remover</Button>}
        <Button icon="check" disabled={!valid} onClick={save}>Salvar faixa</Button>
      </>}>
      <div className="stack">
        <Notice tone="info" icon="target">
          O DiaBem não define uma faixa padrão. Informe a faixa orientada pela sua equipe de saúde — ela é usada só para organizar seus gráficos.
        </Notice>
        <div className="input-row">
          <TextField label={`Limite inferior (${unit})`} value={low} onChange={(v) => setLow(v.replace(/[^0-9.,]/g, ''))} inputMode="decimal" />
          <TextField label={`Limite superior (${unit})`} value={high} onChange={(v) => setHigh(v.replace(/[^0-9.,]/g, ''))} inputMode="decimal" />
        </div>
        {low !== '' && high !== '' && lo >= hi && <p className="small" style={{ color: 'var(--amber-ink)' }}>O limite inferior precisa ser menor que o superior.</p>}
        <div className="field">
          <span className="field-label">Quem definiu esta faixa?</span>
          <Segmented label="Quem definiu" value={by} onChange={setBy} options={[{ value: 'professional', label: 'Meu profissional' }, { value: 'user', label: 'Eu mesmo(a)' }]} />
        </div>
      </div>
    </Sheet>
  );
}
