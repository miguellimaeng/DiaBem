/* =========================================================
   Receitas de demonstração.
   Informação nutricional fica `null` de propósito: só deve
   ser preenchida a partir de fonte confiável (ex.: cálculo
   com a TACO/UNICAMP feito por nutricionista). Nada de
   números inventados.
   ========================================================= */
import type { Recipe, RecipeCategory } from '@/types/models';

export const RECIPE_CATEGORY_LABEL: Record<RecipeCategory, string> = {
  breakfast: 'Café da manhã', lunch: 'Almoço', dinner: 'Jantar', snack: 'Lanches', dessert: 'Sobremesas', quick: 'Rápidas',
};

export const RECIPES: Recipe[] = [
  {
    id: 'r-omelete', name: 'Omelete com legumes', categories: ['breakfast', 'dinner', 'quick'], timeMin: 15, difficulty: 'easy', illustration: 'omelet', isDemo: true,
    ingredients: ['2 ovos', '1/2 tomate picado', '1/4 de cebola picada', '2 colheres (sopa) de espinafre ou couve picada', 'Sal e ervas a gosto', '1 colher (chá) de azeite'],
    steps: ['Bata os ovos com sal e ervas.', 'Aqueça o azeite numa frigideira antiaderente e refogue a cebola por 1 minuto.', 'Junte o tomate e as folhas e mexa rapidamente.', 'Despeje os ovos, abaixe o fogo e tampe até firmar.', 'Dobre ao meio e sirva.'],
    tip: 'Dá para variar com abobrinha, cogumelos ou queijo branco.',
    nutrition: null,
  },
  {
    id: 'r-salada-frango', name: 'Salada completa com frango', categories: ['lunch', 'dinner'], timeMin: 20, difficulty: 'easy', illustration: 'salad', isDemo: true,
    ingredients: ['1 filé de frango (cerca de 120 g)', 'Folhas verdes a gosto', '1 tomate', '1/2 pepino', '3 colheres (sopa) de grão-de-bico cozido', 'Azeite, limão e sal a gosto'],
    steps: ['Tempere o frango com sal, limão e ervas e grelhe até dourar dos dois lados.', 'Lave e corte as folhas, o tomate e o pepino.', 'Monte o prato com as folhas, os legumes e o grão-de-bico.', 'Fatie o frango por cima e regue com azeite e limão.'],
    nutrition: null,
  },
  {
    id: 'r-mingau-aveia', name: 'Mingau de aveia com canela', categories: ['breakfast', 'quick'], timeMin: 10, difficulty: 'easy', illustration: 'oats', isDemo: true,
    ingredients: ['3 colheres (sopa) de aveia em flocos', '200 ml de leite ou bebida vegetal', 'Canela a gosto', 'Frutas picadas para servir (opcional)'],
    steps: ['Coloque a aveia e o leite numa panela pequena.', 'Cozinhe em fogo baixo, mexendo, por 4 a 5 minutos até engrossar.', 'Finalize com canela e frutas, se quiser.'],
    tip: 'A aveia tem fibras. A quantidade de carboidrato da porção pode ser conferida com seu nutricionista.',
    nutrition: null,
  },
  {
    id: 'r-peixe-forno', name: 'Peixe assado com legumes', categories: ['lunch', 'dinner'], timeMin: 35, difficulty: 'medium', illustration: 'fish', isDemo: true,
    ingredients: ['1 posta de peixe branco (tilápia, merluza ou pescada)', '1 abobrinha em rodelas', '1/2 pimentão em tiras', '1 tomate em rodelas', 'Alho, limão, sal e azeite'],
    steps: ['Preaqueça o forno a 200 °C.', 'Tempere o peixe com alho, limão e sal.', 'Arrume os legumes numa assadeira, coloque o peixe por cima e regue com azeite.', 'Cubra com papel-alumínio e asse por 20 minutos; retire o papel e asse por mais 5 a 10 minutos.'],
    nutrition: null,
  },
  {
    id: 'r-sopa-legumes', name: 'Sopa de legumes com frango', categories: ['dinner'], timeMin: 40, difficulty: 'easy', illustration: 'soup', isDemo: true,
    ingredients: ['150 g de peito de frango em cubos', '1 cenoura', '1 chuchu', '1 abobrinha', '1/2 cebola e 1 dente de alho', 'Cheiro-verde, sal e 1 litro de água'],
    steps: ['Refogue a cebola e o alho com um fio de azeite.', 'Junte o frango e doure levemente.', 'Acrescente os legumes picados e a água.', 'Cozinhe por cerca de 25 minutos, até os legumes ficarem macios.', 'Finalize com cheiro-verde.'],
    nutrition: null,
  },
  {
    id: 'r-iogurte-frutas', name: 'Iogurte natural com frutas', categories: ['snack', 'breakfast', 'quick'], timeMin: 5, difficulty: 'easy', illustration: 'yogurt', isDemo: true,
    ingredients: ['1 pote de iogurte natural sem açúcar', 'Frutas picadas (morango, banana ou mamão)', '1 colher (sopa) de sementes (chia ou linhaça)'],
    steps: ['Coloque o iogurte numa tigela.', 'Cubra com as frutas e as sementes.', 'Sirva na hora.'],
    nutrition: null,
  },
  {
    id: 'r-frango-desfiado', name: 'Wrap de frango desfiado', categories: ['snack', 'dinner'], timeMin: 20, difficulty: 'easy', illustration: 'chicken', isDemo: true,
    ingredients: ['1 pão folha integral (rap10 ou similar)', '3 colheres (sopa) de frango desfiado temperado', 'Folhas, tomate e cenoura ralada', '1 colher (sopa) de requeijão light ou ricota'],
    steps: ['Espalhe o requeijão ou a ricota no pão folha.', 'Distribua o frango e os vegetais.', 'Enrole firme e aqueça numa frigideira por 1 minuto de cada lado.'],
    nutrition: null,
  },
  {
    id: 'r-frutas-assadas', name: 'Maçã assada com canela', categories: ['dessert'], timeMin: 25, difficulty: 'easy', illustration: 'fruit', isDemo: true,
    ingredients: ['1 maçã', 'Canela em pó', '1 colher (sopa) de castanhas picadas (opcional)'],
    steps: ['Preaqueça o forno a 180 °C.', 'Corte a maçã ao meio e retire as sementes.', 'Polvilhe canela e, se quiser, castanhas.', 'Asse por 15 a 20 minutos, até ficar macia.'],
    tip: 'Sobremesa simples, sem açúcar adicionado.',
    nutrition: null,
  },
];

export const getRecipe = (id: string) => RECIPES.find((r) => r.id === id);
export const DIFFICULTY_LABEL = { easy: 'Fácil', medium: 'Média', hard: 'Elaborada' } as const;
