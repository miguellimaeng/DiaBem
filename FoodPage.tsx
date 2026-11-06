/* Alimentação — "O que comi e o que posso aprender?" */
import { useEffect, useMemo, useState } from 'react';
import { useApp } from '@/app/AppContext';
import { useData } from '@/app/useData';
import { navigate, ROUTES } from '@/app/router';
import { repo } from '@/database/repositories';
import { Button, Card, Cat, DemoTag, Empty, PageHead, Pills, Section, Segmented } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { Illustration } from '@/components/Illustration';
import { MEAL_LABEL } from '@/config/categories';
import { addDays, fmtDayLabel, fmtTime, startOfDay } from '@/utils/date';
import { RECIPES, RECIPE_CATEGORY_LABEL, DIFFICULTY_LABEL } from './recipes.data';
import type { MealRecord, Recipe, RecipeCategory } from '@/types/models';

type Tab = 'history' | 'recipes' | 'favorites' | 'learn';

export function FoodPage() {
  const { openQuick, t, mode } = useApp();
  const [tab, setTab] = useState<Tab>(() => (sessionStorage.getItem('food-tab') as Tab) || 'history');
  useEffect(() => { try { sessionStorage.setItem('food-tab', tab); } catch { /* ignore */ } }, [tab]);

  return (
    <div>
      <PageHead title={t('Alimentação', 'Comida')} subtitle={t('O que comi e o que posso aprender?', 'O que você comeu e dicas gostosas')} />

      <div className="quick" style={{ ['--quick-cols' as string]: 3 }}>
        <button className="quick-btn" onClick={() => openQuick('meal')}><Cat icon="plus" tone="amber" />Registrar</button>
        <button className="quick-btn" onClick={() => openQuick('meal', { preset: { photoFirst: true } })}><Cat icon="camera" tone="blue" />Com foto</button>
        <button className="quick-btn" onClick={() => setTab('favorites')}><Cat icon="star" tone="rose" />Favoritos</button>
      </div>

      <div className="mt-4">
        <Segmented label="Seção da alimentação" value={tab} onChange={setTab} options={[
          { value: 'history', label: 'Histórico' }, { value: 'recipes', label: 'Receitas' },
          ...(mode === 'easy' ? [] : [{ value: 'favorites' as Tab, label: 'Favoritos' }]), { value: 'learn', label: 'Aprender' },
        ]} />
      </div>

      <div className="mt-3">
        {tab === 'history' && <History />}
        {tab === 'recipes' && <RecipeLibrary />}
        {tab === 'favorites' && <Favorites />}
        {tab === 'learn' && <FoodLearn />}
      </div>
    </div>
  );
}

function MealPhoto({ blob }: { blob: Blob }) {
  const url = useMemo(() => URL.createObjectURL(blob), [blob]);
  useEffect(() => () => URL.revokeObjectURL(url), [url]);
  return <img src={url} alt="" style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 12 }} />;
}

function History() {
  const { openQuick } = useApp();
  const [days, setDays] = useState(7);
  const { data: meals } = useData(() => repo.meals.between(addDays(startOfDay(), -(days - 1)), new Date()), [days], ['meals']);
  const groups = useMemo(() => {
    const g = new Map<string, MealRecord[]>();
    [...(meals ?? [])].reverse().forEach((m) => {
      const k = startOfDay(new Date(m.at)).toISOString();
      g.set(k, [...(g.get(k) ?? []), m]);
    });
    return [...g.entries()];
  }, [meals]);

  if (meals && !meals.length) {
    return <Card><Empty icon="utensils" tone="amber" title="Nenhuma refeição registrada" text="Registre o que comeu — com ou sem foto. Não existe refeição certa ou errada aqui." action={<Button icon="plus" onClick={() => openQuick('meal')}>Registrar refeição</Button>} /></Card>;
  }
  return (
    <div className="stack">
      {groups.map(([day, list]) => (
        <div key={day}>
          <div className="small strong muted mb-2">{fmtDayLabel(new Date(day))}</div>
          <Card className="tight">
            <div className="list">
              {list.map((m) => (
                <button key={m.id} className="list-item list-btn" onClick={() => openQuick('meal', { editId: m.id })}>
                  {m.photo ? <MealPhoto blob={m.photo} /> : <Cat icon="utensils" tone="amber" />}
                  <div className="grow" style={{ minWidth: 0 }}>
                    <div className="title row" style={{ gap: 6 }}>{MEAL_LABEL[m.mealType]}{m.favorite && <Icon name="star" size={13} style={{ color: 'var(--rose)' }} />}{m.isDemo && <DemoTag />}</div>
                    <div className="sub truncate">{fmtTime(m.at)} · {m.description}</div>
                  </div>
                  {m.carbsGrams != null && <span className="badge amber">{m.carbsGrams} g</span>}
                </button>
              ))}
            </div>
          </Card>
        </div>
      ))}
      {meals && meals.length > 0 && days < 90 && <Button variant="ghost" onClick={() => setDays(days === 7 ? 30 : 90)}>Ver mais dias</Button>}
    </div>
  );
}

export function RecipeCard({ r }: { r: Recipe }) {
  return (
    <button className="card clickable recipe-card" onClick={() => navigate(`${ROUTES.food}/receita/${r.id}`)}>
      <Illustration name={r.illustration} height={104} size={88} radius={0} />
      <div className="body">
        <div className="title">{r.name}</div>
        <div className="xsmall muted mt-2 row" style={{ gap: 4 }}><Icon name="clock" size={12} /> {r.timeMin} min · {DIFFICULTY_LABEL[r.difficulty]}</div>
      </div>
    </button>
  );
}

function RecipeLibrary() {
  const [cat, setCat] = useState<RecipeCategory | 'all'>('all');
  const list = RECIPES.filter((r) => cat === 'all' || r.categories.includes(cat));
  return (
    <>
      <Pills label="Categoria" value={cat} onChange={setCat} options={[{ value: 'all', label: 'Todas' }, ...(Object.keys(RECIPE_CATEGORY_LABEL) as RecipeCategory[]).map((c) => ({ value: c, label: RECIPE_CATEGORY_LABEL[c] }))]} />
      <div className="recipe-grid mt-3">{list.map((r) => <RecipeCard key={r.id} r={r} />)}</div>
      <p className="xsmall muted mt-3">Receitas de demonstração. Informações nutricionais só aparecem quando houver fonte confiável.</p>
    </>
  );
}

function Favorites() {
  const { openQuick } = useApp();
  const { data } = useData(async () => {
    const [favs, meals] = await Promise.all([repo.favorites.all(), repo.meals.all()]);
    const favMeals = meals.filter((m) => m.favorite).sort((a, b) => b.at.localeCompare(a.at));
    // remove duplicatas por descrição
    const seen = new Set<string>();
    return { recipes: RECIPES.filter((r) => favs.some((f) => f.id === r.id)), meals: favMeals.filter((m) => !seen.has(m.description) && seen.add(m.description)) };
  }, [], ['favorites', 'meals']);

  if (data && !data.recipes.length && !data.meals.length) {
    return <Card><Empty icon="star" tone="rose" title="Nada favoritado ainda" text="Marque receitas com a estrela ou salve refeições como favoritas para repetir com um toque." /></Card>;
  }
  return (
    <div className="stack">
      {!!data?.meals.length && (
        <>
          <Section title="Refeições favoritas" />
          <Card className="tight">
            <div className="list">
              {data.meals.map((m) => (
                <div key={m.id} className="list-item">
                  <Cat icon="utensils" tone="amber" size="sm" />
                  <div className="grow" style={{ minWidth: 0 }}><div className="title truncate">{m.description}</div><div className="sub">{MEAL_LABEL[m.mealType]}</div></div>
                  <Button small variant="soft" onClick={() => openQuick('meal', { preset: { description: m.description } })}>Repetir</Button>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
      {!!data?.recipes.length && (
        <>
          <Section title="Receitas favoritas" />
          <div className="recipe-grid">{data.recipes.map((r) => <RecipeCard key={r.id} r={r} />)}</div>
        </>
      )}
    </div>
  );
}

function FoodLearn() {
  const { t } = useApp();
  return (
    <div className="stack">
      <Card>
        <div className="media-row">
          <Illustration name="food" />
          <div>
            <div className="title">{t('Um jeito visual de montar o prato', 'O prato colorido')}</div>
            <div className="sub">Educação alimentar geral</div>
          </div>
        </div>
        <div className="lesson-body mt-3">
          <p>Uma forma visual bastante usada em educação alimentar é dividir o prato: metade com vegetais e legumes, um quarto com proteínas (carnes, ovos, leguminosas) e um quarto com alimentos ricos em carboidratos (arroz, batata, massas).</p>
          <p className="small muted">É uma referência geral, não uma prescrição. Quantidades e escolhas para você são definidas com seu nutricionista.</p>
        </div>
      </Card>
      <button className="card clickable" onClick={() => navigate(`${ROUTES.learn}/carbs`)}>
        <div className="media-row"><Illustration name="carbs" /><div><div className="title">Carboidratos e glicose</div><div className="sub">Aula de 2 minutos</div></div></div>
      </button>
      <Card>
        <div className="row"><Cat icon="camera" tone="blue" /><div className="grow"><div className="strong small">Análise de foto (em breve)</div><div className="xsmall muted">No futuro, o app poderá sugerir o que há no prato — sempre como estimativa editável e com seu consentimento.</div></div></div>
      </Card>
    </div>
  );
}
