import { useApp } from '@/app/AppContext';
import { useData } from '@/app/useData';
import { back, ROUTES } from '@/app/router';
import { repo } from '@/database/repositories';
import { Button, Card, DemoTag, Empty, IconButton, Notice } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { Illustration } from '@/components/Illustration';
import { getRecipe, DIFFICULTY_LABEL, RECIPE_CATEGORY_LABEL } from './recipes.data';
import { nowISO } from '@/utils/date';

export function RecipePage({ id }: { id: string }) {
  const { openQuick, toast } = useApp();
  const r = getRecipe(id);
  const { data: fav } = useData(() => repo.favorites.get(id), [id], ['favorites']);

  if (!r) return <Card><Empty icon="utensils" title="Receita não encontrada" action={<Button onClick={() => back(ROUTES.food)}>Voltar</Button>} /></Card>;

  async function toggleFav() {
    if (fav) { await repo.favorites.remove(id); toast('Removida dos favoritos'); }
    else { await repo.favorites.put({ id, createdAt: nowISO() }); toast('Receita favoritada'); }
  }

  const n = r.nutrition;
  return (
    <article>
      <div className="row-between mb-3">
        <IconButton icon="chevronLeft" label="Voltar" onClick={() => back(ROUTES.food)} />
        <IconButton icon="star" label={fav ? 'Remover dos favoritos' : 'Favoritar receita'} variant={fav ? 'danger' : undefined} onClick={toggleFav} />
      </div>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <Illustration name={r.illustration} height={170} size={150} radius={0} />
        <div style={{ padding: 16 }}>
          <div className="row" style={{ gap: 6 }}>{r.categories.map((c) => <span key={c} className="badge gray">{RECIPE_CATEGORY_LABEL[c]}</span>)}{r.isDemo && <DemoTag />}</div>
          <h1 className="mt-2">{r.name}</h1>
          <div className="row small muted mt-2" style={{ gap: 14 }}>
            <span className="row" style={{ gap: 4 }}><Icon name="clock" size={15} /> {r.timeMin} min</span>
            <span className="row" style={{ gap: 4 }}><Icon name="zap" size={15} /> {DIFFICULTY_LABEL[r.difficulty]}</span>
          </div>
        </div>
      </div>

      <Card title="Ingredientes">
        <ul className="lesson-body" style={{ margin: 0 }}>{r.ingredients.map((i) => <li key={i}>{i}</li>)}</ul>
      </Card>
      <Card title="Modo de preparo">
        <ol className="lesson-body" style={{ margin: 0, paddingLeft: 20 }}>{r.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
        {r.tip && <div className="keypoint mt-3">{r.tip}</div>}
      </Card>
      <Card title="Informação nutricional">
        {n ? (
          <div className="grid-3">
            {n.carbsGrams != null && <div className="stat"><div className="stat-value">{n.carbsGrams}<small>g</small></div><div className="stat-label">Carboidratos (estim.)</div></div>}
            {n.proteinGrams != null && <div className="stat"><div className="stat-value">{n.proteinGrams}<small>g</small></div><div className="stat-label">Proteínas</div></div>}
            {n.fiberGrams != null && <div className="stat"><div className="stat-value">{n.fiberGrams}<small>g</small></div><div className="stat-label">Fibras</div></div>}
            <p className="xsmall muted" style={{ gridColumn: '1 / -1' }}>Fonte: {n.source}{n.servings ? ` · por porção (${n.servings} porções)` : ''}</p>
          </div>
        ) : (
          <Notice tone="neutral">Ainda não temos dados nutricionais confiáveis para esta receita, então não mostramos números. A quantidade de carboidratos depende das marcas e porções — confira rótulos ou peça ajuda ao seu nutricionista.</Notice>
        )}
      </Card>
      <Button block icon="utensils" className="mt-4" onClick={() => openQuick('meal', { preset: { description: r.name, recipeId: r.id } })}>Registrar como refeição</Button>
    </article>
  );
}
