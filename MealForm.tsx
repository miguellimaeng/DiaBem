import { useEffect, useMemo, useState } from 'react';
import { useApp } from '@/app/AppContext';
import { repo } from '@/database/repositories';
import { Button, Choices, DateTimeFields, Notice, Sheet, Steps, Switch, TextField } from '@/components/ui';
import { useWhen } from '@/components/ui/RecordSheet';
import { Icon } from '@/components/Icon';
import { MEAL_LABEL } from '@/config/categories';
import type { MealType } from '@/types/models';
import type { FormProps } from '../glucose/GlucoseForm';
import { compressImage } from '@/utils/image';

const TYPES = (Object.keys(MEAL_LABEL) as MealType[]).map((v) => ({ value: v, label: MEAL_LABEL[v] }));
const STEP_LABELS = ['Tipo', 'Descrição', 'Foto', 'Observação'];

function guessMeal(): MealType {
  const h = new Date().getHours();
  if (h >= 5 && h < 10) return 'breakfast';
  if (h >= 11 && h < 15) return 'lunch';
  if (h >= 18 && h < 22) return 'dinner';
  return 'snack';
}

export function MealForm({ editId, preset, onDone }: FormProps) {
  const { toast, t, mode } = useApp();
  const [step, setStep] = useState(preset?.photoFirst ? 2 : 0);
  const [mealType, setMealType] = useState<MealType>(guessMeal());
  const [description, setDescription] = useState(String(preset?.description ?? ''));
  const [carbs, setCarbs] = useState('');
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [note, setNote] = useState('');
  const [favorite, setFavorite] = useState(false);
  const [busy, setBusy] = useState(false);
  const when = useWhen();
  const recipeId = preset?.recipeId as string | undefined;

  useEffect(() => {
    if (!editId) return;
    repo.meals.get(editId).then((m) => {
      if (!m) return;
      setMealType(m.mealType); setDescription(m.description); setCarbs(m.carbsGrams != null ? String(m.carbsGrams) : '');
      setPhoto(m.photo ?? null); setNote(m.note ?? ''); setFavorite(!!m.favorite); when.reset(m.at);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

  const photoUrl = useMemo(() => (photo ? URL.createObjectURL(photo) : null), [photo]);
  useEffect(() => () => { if (photoUrl) URL.revokeObjectURL(photoUrl); }, [photoUrl]);

  const carbsNum = carbs.trim() === '' ? null : Number(carbs.replace(',', '.'));
  const carbsValid = carbsNum == null || (Number.isFinite(carbsNum) && carbsNum >= 0 && carbsNum <= 1000);
  const canNext = step === 1 ? description.trim().length > 0 && carbsValid : true;
  const last = step === STEP_LABELS.length - 1;

  async function onFile(f: File | undefined) {
    if (!f) return;
    setPhoto(await compressImage(f, 1280, 0.82));
  }

  async function save() {
    if (!description.trim()) { setStep(1); return; }
    setBusy(true);
    const data = {
      mealType, description: description.trim(), carbsGrams: carbsNum, photo, note: note.trim() || undefined,
      favorite, at: when.iso(), recipeId,
    };
    try {
      if (editId) await repo.meals.update(editId, data);
      else await repo.meals.add(data);
      toast(t('Refeição registrada', 'Comida anotada!'));
      onDone();
    } finally { setBusy(false); }
  }

  return (
    <Sheet open title={editId ? 'Editar refeição' : t('Registrar refeição', 'O que você comeu?')} onClose={onDone}
      footer={
        <>
          {step > 0
            ? <Button variant="ghost" icon="chevronLeft" onClick={() => setStep(step - 1)}>Voltar</Button>
            : editId ? <Button variant="ghost" icon="trash" onClick={async () => { await repo.meals.remove(editId); toast('Refeição excluída'); onDone(); }}>Excluir</Button> : null}
          {last
            ? <Button icon="check" disabled={busy} onClick={save}>Salvar</Button>
            : <Button disabled={!canNext} onClick={() => setStep(step + 1)}>{step === 2 && !photo ? 'Pular' : 'Continuar'}</Button>}
        </>
      }
    >
      <Steps total={STEP_LABELS.length} current={step} labels={STEP_LABELS} />
      <div className="stack">
        {step === 0 && (
          <>
            <h3>{t('Qual refeição?', 'Que hora de comer é essa?')}</h3>
            <Choices label="Tipo de refeição" options={TYPES} value={mealType} onChange={setMealType} />
            <DateTimeFields date={when.date} time={when.time} onDate={when.setDate} onTime={when.setTime} />
          </>
        )}
        {step === 1 && (
          <>
            <TextField label={t('O que você comeu?', 'Conte o que tinha no prato')} value={description} onChange={setDescription}
              placeholder="Ex.: arroz, feijão, frango grelhado e salada" multiline autoFocus />
            {mode !== 'child' && (
              <TextField label="Carboidratos em gramas (opcional)" value={carbs} onChange={(v) => setCarbs(v.replace(/[^0-9.,]/g, ''))}
                inputMode="decimal" placeholder="Deixe em branco se não souber"
                hint="Informe só se você contou ou leu no rótulo. O app não estima carboidratos." />
            )}
          </>
        )}
        {step === 2 && (
          <>
            <h3>Foto do prato (opcional)</h3>
            {photoUrl ? (
              <div className="photo-preview">
                <img src={photoUrl} alt="Foto da refeição" />
                <div className="row mt-2">
                  <Button variant="ghost" small icon="trash" onClick={() => setPhoto(null)}>Remover foto</Button>
                </div>
              </div>
            ) : (
              <label className="upload">
                <Icon name="camera" size={28} />
                <strong className="small">Tirar ou escolher foto</strong>
                <span className="xsmall muted">A foto fica guardada só neste aparelho.</span>
                <input type="file" accept="image/*" capture="environment" onChange={(e) => onFile(e.target.files?.[0])} />
              </label>
            )}
          </>
        )}
        {step === 3 && (
          <>
            <TextField label="Observação (opcional)" value={note} onChange={setNote} multiline placeholder="Ex.: comi fora de casa, porção maior que o normal" />
            <Switch label="Salvar como favorita" hint="Para registrar de novo com um toque." checked={favorite} onChange={setFavorite} />
            <Notice tone="neutral">Registrar refeições ajuda você e sua equipe a enxergar padrões. Não existe refeição “certa” ou “errada” aqui.</Notice>
          </>
        )}
      </div>
    </Sheet>
  );
}
