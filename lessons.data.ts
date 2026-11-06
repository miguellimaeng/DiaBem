/* =========================================================
   Conteúdo educativo — curto, visual e sem prescrição.
   Revisão recomendada por profissional de saúde antes do
   lançamento público. Nenhum texto indica dose, meta ou
   conduta individual: sempre remete ao plano da equipe.
   ========================================================= */
import type { LearningModule } from '@/types/models';

export const LESSONS: LearningModule[] = [
  {
    id: 'what-is-diabetes', topic: 'basics', title: 'O que é diabetes', titleChild: 'O que é o diabetes?', minutes: 2, level: 'básico', tone: 'blue',
    summary: 'Entenda o básico em linguagem simples.',
    cards: [
      {
        title: 'A energia do corpo',
        body: ['Nosso corpo usa a glicose, um tipo de açúcar que vem dos alimentos, como fonte de energia.', 'Para a glicose sair do sangue e entrar nas células, o corpo precisa de um hormônio chamado insulina, produzido pelo pâncreas.'],
        bodyChild: ['A comida vira energia para você brincar, estudar e crescer. Essa energia se chama glicose.', 'A insulina é como uma chave que abre a porta das células para a glicose entrar.'],
        keyPoint: 'Glicose é energia. Insulina é a chave que ajuda essa energia a entrar nas células.',
      },
      {
        title: 'O que acontece no diabetes',
        body: ['No diabetes, o corpo não produz insulina suficiente ou não consegue usá-la bem. Assim, a glicose tende a ficar mais alta no sangue.', 'Com acompanhamento, rotina e informação, é possível viver bem e fazer as atividades do dia a dia.'],
        bodyChild: ['No diabetes, a chave (insulina) falta ou não funciona direito. Por isso a gente acompanha a glicose e cuida da rotina.', 'Muitas pessoas com diabetes estudam, praticam esportes e fazem tudo o que gostam!'],
        keyPoint: 'Diabetes não é culpa de ninguém. É uma condição que se acompanha todos os dias.',
      },
    ],
    quiz: [
      { question: 'Qual hormônio ajuda a glicose a entrar nas células?', options: ['Adrenalina', 'Insulina', 'Melatonina'], correctIndex: 1, explanation: 'A insulina, produzida pelo pâncreas, ajuda a glicose a entrar nas células.' },
      { question: 'De onde vem a glicose que o corpo usa?', options: ['Principalmente dos alimentos', 'Só dos doces', 'Do ar que respiramos'], correctIndex: 0, explanation: 'A glicose vem principalmente dos alimentos, especialmente dos que têm carboidratos — não apenas dos doces.' },
    ],
  },
  {
    id: 'type-1', topic: 'type1', title: 'Diabetes tipo 1', minutes: 2, level: 'básico', tone: 'violet',
    summary: 'Por que a insulina é parte do tratamento.',
    cards: [
      {
        title: 'O que é o tipo 1',
        body: ['No diabetes tipo 1, o sistema de defesa do corpo ataca as células do pâncreas que produzem insulina. Com o tempo, o corpo passa a produzir pouca ou nenhuma insulina.', 'É mais comum começar na infância ou juventude, mas pode aparecer em qualquer idade.'],
        bodyChild: ['No tipo 1, o pâncreas parou de fazer insulina. Não é porque você comeu doce ou fez algo errado.', 'Por isso a insulina vem de fora: de canetas, seringas ou bombas.'],
        keyPoint: 'O tipo 1 não é causado por hábitos. Não há culpa envolvida.',
      },
      {
        title: 'No dia a dia',
        body: ['A insulina é parte essencial do tratamento do tipo 1. O tipo, a dose e os horários são definidos com a equipe de saúde.', 'Registrar glicose, refeições, atividades e aplicações ajuda a equipe a ajustar o plano com você.'],
        keyPoint: 'Os registros são uma ferramenta para conversar com a equipe, não uma prova.',
      },
    ],
    quiz: [
      { question: 'O diabetes tipo 1 é causado por comer muito doce?', options: ['Sim', 'Não'], correctIndex: 1, explanation: 'Não. O tipo 1 acontece porque o sistema de defesa do corpo ataca as células que produzem insulina.' },
      { question: 'Quem define a dose de insulina?', options: ['Um aplicativo', 'A equipe de saúde, junto com a pessoa', 'Um amigo com diabetes'], correctIndex: 1, explanation: 'Doses e ajustes são definidos com a equipe de saúde. O DiaBem apenas registra o que foi aplicado.' },
    ],
  },
  {
    id: 'type-2', topic: 'type2', title: 'Diabetes tipo 2', minutes: 2, level: 'básico', tone: 'teal',
    summary: 'O tipo mais comum e como ele é acompanhado.',
    cards: [
      {
        title: 'O que é o tipo 2',
        body: ['No diabetes tipo 2, o corpo ainda produz insulina, mas ela não funciona tão bem (resistência à insulina) e, com o tempo, a produção pode diminuir.', 'Fatores genéticos, idade e estilo de vida podem influenciar. É o tipo mais comum.'],
        keyPoint: 'No tipo 2 a insulina existe, mas o corpo tem mais dificuldade de usá-la.',
      },
      {
        title: 'Tratamento é individual',
        body: ['O plano pode incluir alimentação, atividade física, medicamentos orais, injetáveis e, em alguns casos, insulina.', 'Precisar de insulina no tipo 2 não significa “fracasso”: é uma das ferramentas possíveis, escolhida com o médico.'],
        keyPoint: 'Cada plano é único. Comparar o seu tratamento com o de outra pessoa raramente ajuda.',
      },
    ],
    quiz: [
      { question: 'No tipo 2, o que costuma acontecer com a insulina?', options: ['O corpo não a usa tão bem', 'Ela é sempre zero', 'Ela não tem relação com o tipo 2'], correctIndex: 0, explanation: 'No tipo 2 é comum haver resistência à insulina: ela existe, mas age com mais dificuldade.' },
      { question: 'Usar insulina no tipo 2 significa que a pessoa falhou?', options: ['Sim', 'Não'], correctIndex: 1, explanation: 'Não. A insulina é uma ferramenta de tratamento como outras.' },
    ],
  },
  {
    id: 'what-is-glucose', topic: 'glucose', title: 'O que é glicose e por que ela varia', titleChild: 'Por que a glicose sobe e desce?', minutes: 3, level: 'básico', tone: 'blue',
    summary: 'Muitas coisas além da comida mexem na glicose.',
    cards: [
      {
        title: 'A glicose muda o dia todo',
        body: ['É normal a glicose variar ao longo do dia. Alimentação, atividade física, medicamentos, sono, estresse, doenças e até o ciclo hormonal podem influenciar.', 'Por isso um único número diz pouco. O que ajuda é observar padrões ao longo dos dias.'],
        bodyChild: ['A glicose sobe e desce várias vezes por dia — isso é normal!', 'Comida, brincadeira, sono e até ficar nervoso podem mudar a glicose.'],
        keyPoint: 'Um número é uma foto. Vários registros formam um filme.',
      },
      {
        title: 'Números não são notas',
        body: ['Um valor fora da sua faixa não é “nota ruim”. É uma informação que ajuda a entender o que aconteceu.', 'A faixa que aparece no DiaBem é a que você ou seu profissional configurou — o app não define metas.'],
        keyPoint: 'Registrar é sempre positivo, qualquer que seja o número.',
      },
    ],
    quiz: [
      { question: 'O que pode influenciar a glicose?', options: ['Só a comida', 'Comida, exercício, sono, estresse e mais', 'Nada, ela é sempre igual'], correctIndex: 1, explanation: 'Vários fatores influenciam a glicose. Por isso observar padrões é mais útil do que um único valor.' },
      { question: 'Um valor fora da faixa significa que você fez algo errado?', options: ['Sim', 'Não, é uma informação'], correctIndex: 1, explanation: 'Valores fora da faixa acontecem. Eles são informação para conversar com a equipe, não um julgamento.' },
    ],
  },
  {
    id: 'carbs', topic: 'carbs', title: 'Como os carboidratos podem influenciar a glicose?', titleChild: 'Carboidratos: o que são?', minutes: 2, level: 'básico', tone: 'amber',
    summary: 'O nutriente que mais influencia a glicose depois das refeições.',
    cards: [
      {
        title: 'Onde estão os carboidratos',
        body: ['Carboidratos estão em alimentos como pães, arroz, massas, batata, mandioca, frutas, leite, feijão e doces.', 'Durante a digestão, eles se transformam em glicose. Por isso costumam ser o nutriente que mais influencia a glicose depois de comer.'],
        bodyChild: ['Pão, arroz, macarrão, frutas e leite têm carboidratos.', 'O corpo transforma carboidratos em glicose, que é energia!'],
        keyPoint: 'Carboidrato não é vilão: é fonte de energia. Quantidade e combinação fazem diferença.',
      },
      {
        title: 'Combinação no prato',
        body: ['Fibras, proteínas e gorduras na mesma refeição podem deixar a absorção da glicose mais lenta.', 'A quantidade de carboidratos ideal para você é definida com seu nutricionista ou médico. Contagem de carboidratos é uma técnica que pode ser aprendida com a equipe.'],
        keyPoint: 'Anote o que comeu: com o tempo, você e sua equipe enxergam como cada refeição se relaciona aos seus registros.',
      },
    ],
    quiz: [
      { question: 'Qual destes alimentos tem carboidrato?', options: ['Arroz', 'Ovo', 'Azeite'], correctIndex: 0, explanation: 'O arroz é fonte de carboidrato. Ovo é principalmente proteína e azeite é gordura.' },
      { question: 'O que pode deixar a absorção mais lenta?', options: ['Comer só doce', 'Combinar fibras e proteínas na refeição', 'Pular refeições'], correctIndex: 1, explanation: 'Fibras e proteínas na mesma refeição tendem a deixar a absorção mais lenta.' },
    ],
  },
  {
    id: 'hypo', topic: 'hypo', title: 'Hipoglicemia: reconhecer e ter um plano', titleChild: 'Glicose baixa: o que fazer?', minutes: 3, level: 'cuidados', tone: 'rose',
    summary: 'Sinais de glicose baixa e por que combinar um plano.',
    cards: [
      {
        title: 'O que é',
        body: ['Hipoglicemia é quando a glicose fica baixa demais. É mais comum em quem usa insulina ou alguns medicamentos orais.', 'Sinais frequentes: tremor, suor, fome repentina, coração acelerado, tontura, irritação, confusão ou visão embaçada. Algumas pessoas sentem poucos sinais.'],
        bodyChild: ['Quando a glicose fica muito baixa, o corpo avisa: tremedeira, suor, fome, tontura ou ficar confuso.', 'Se sentir isso, avise logo um adulto!'],
        keyPoint: 'Reconhecer os sinais cedo faz diferença.',
      },
      {
        title: 'Tenha um plano combinado',
        body: ['Combine com sua equipe de saúde o que fazer em caso de hipoglicemia: o que consumir, quanto, quando medir de novo e quando pedir ajuda.', 'Deixe as pessoas próximas (família, escola, trabalho) sabendo dos sinais e do plano. A tela de Emergência do DiaBem ajuda nisso.', 'Se a pessoa estiver desacordada ou não conseguir engolir, não ofereça nada pela boca e chame o SAMU (192).'],
        bodyChild: ['Seus pais ou responsáveis e sua equipe de saúde combinam um plano para quando a glicose baixar.', 'Na escola, os professores também podem conhecer esse plano.'],
        keyPoint: 'Hipoglicemia grave é emergência: SAMU 192.',
      },
    ],
    quiz: [
      { question: 'Qual é um sinal comum de hipoglicemia?', options: ['Tremor e suor', 'Muita sede por dias', 'Nenhum sinal nunca'], correctIndex: 0, explanation: 'Tremor, suor, fome repentina e tontura são sinais comuns de glicose baixa.' },
      { question: 'Se a pessoa estiver desacordada, o que fazer?', options: ['Dar água com açúcar na boca', 'Chamar o SAMU (192) e não oferecer nada pela boca', 'Esperar passar'], correctIndex: 1, explanation: 'Nunca ofereça nada pela boca a alguém desacordado. Chame o SAMU (192).' },
    ],
  },
  {
    id: 'hyper', topic: 'hyper', title: 'Hiperglicemia: quando a glicose fica alta', titleChild: 'Glicose alta', minutes: 2, level: 'cuidados', tone: 'amber',
    summary: 'Sinais de glicose alta e quando buscar atendimento.',
    cards: [
      {
        title: 'Sinais',
        body: ['Hiperglicemia é quando a glicose fica acima da faixa por um período. Pode causar sede, vontade frequente de urinar, cansaço, boca seca e visão embaçada.', 'Doenças, estresse, mudança de rotina ou de medicamentos podem contribuir.'],
        bodyChild: ['Quando a glicose fica alta, a gente pode sentir muita sede, fazer muito xixi e ficar cansado.'],
        keyPoint: 'Converse com sua equipe sobre o que fazer quando a glicose fica alta por muito tempo.',
      },
      {
        title: 'Atenção aos sinais de alerta',
        body: ['Glicose alta acompanhada de náusea, vômitos, dor abdominal, respiração rápida, hálito com cheiro de fruta ou muita sonolência pode indicar uma complicação grave (como a cetoacidose).', 'Nesses casos, procure atendimento de urgência.'],
        keyPoint: 'Glicose alta + vômitos ou falta de ar = procure atendimento.',
      },
    ],
    quiz: [
      { question: 'Qual é um sinal possível de glicose alta?', options: ['Muita sede', 'Frio nas mãos', 'Espirros'], correctIndex: 0, explanation: 'Sede, urinar com frequência e cansaço são sinais possíveis de hiperglicemia.' },
      { question: 'Glicose alta com vômitos e respiração rápida pede…', options: ['Esperar até amanhã', 'Atendimento de urgência'], correctIndex: 1, explanation: 'Esses sinais podem indicar uma complicação grave. Procure atendimento.' },
    ],
  },
  {
    id: 'exercise', topic: 'exercise', title: 'Atividade física e glicose', titleChild: 'Movimento é energia!', minutes: 3, level: 'hábitos', tone: 'teal',
    summary: 'Como o movimento se relaciona com a glicose.',
    cards: [
      {
        title: 'Movimento ajuda',
        body: ['A atividade física ajuda o corpo a usar a glicose e pode melhorar a ação da insulina. Também faz bem para o coração, o humor e o sono.', 'Caminhar, dançar, pedalar ou brincar: o melhor exercício é aquele que você consegue manter.'],
        bodyChild: ['Correr, pular, dançar e brincar fazem bem para o corpo e para a cabeça!'],
        keyPoint: 'Constância importa mais do que intensidade.',
      },
      {
        title: 'Registre e observe',
        body: ['O exercício pode baixar a glicose durante e até horas depois — especialmente em quem usa insulina. Algumas atividades intensas podem elevá-la temporariamente.', 'Combine com sua equipe como se preparar para atividades. Registrar atividade e glicose ajuda a entender sua resposta.'],
        keyPoint: 'Leve sempre o que foi combinado para o caso de hipoglicemia.',
      },
    ],
    quiz: [
      { question: 'A atividade física pode…', options: ['Ajudar o corpo a usar a glicose', 'Não ter nenhum efeito', 'Sempre subir a glicose'], correctIndex: 0, explanation: 'A atividade física geralmente ajuda o corpo a usar a glicose, e o efeito pode durar horas.' },
      { question: 'Qual é o melhor exercício?', options: ['O mais difícil', 'Aquele que você consegue manter', 'Só academia'], correctIndex: 1, explanation: 'O exercício que você gosta e consegue manter costuma trazer mais benefícios a longo prazo.' },
    ],
  },
  {
    id: 'sleep', topic: 'sleep', title: 'Sono e diabetes', minutes: 2, level: 'hábitos', tone: 'violet',
    summary: 'Dormir bem também faz parte do cuidado.',
    cards: [
      {
        title: 'Por que o sono importa',
        body: ['Noites mal dormidas podem afetar hormônios ligados à fome e à ação da insulina, e também o humor e a disposição.', 'Horários regulares, quarto escuro e menos telas antes de dormir costumam ajudar.'],
        keyPoint: 'Registrar o sono na linha do tempo ajuda a enxergar relações com seus outros registros.',
      },
    ],
    quiz: [
      { question: 'Dormir mal pode influenciar…', options: ['A fome e a ação da insulina', 'Nada no corpo'], correctIndex: 0, explanation: 'O sono influencia hormônios, fome, disposição e a forma como o corpo usa a insulina.' },
    ],
  },
  {
    id: 'insulin-basics', topic: 'insulin', title: 'Insulina: conceitos básicos', minutes: 3, level: 'rotina', tone: 'violet',
    summary: 'Tipos de insulina e cuidados de armazenamento.',
    cards: [
      {
        title: 'Basal e bolus',
        body: ['De forma geral, a insulina basal atua por mais tempo e cobre as necessidades do corpo ao longo do dia. A insulina de bolus (rápida ou ultrarrápida) costuma ser usada nas refeições ou para correções, conforme o plano.', 'Cada pessoa tem um esquema próprio, definido com o médico.'],
        keyPoint: 'O DiaBem registra o que foi aplicado — nunca calcula dose.',
      },
      {
        title: 'Cuidados práticos',
        body: ['Siga as orientações da bula e da equipe sobre armazenamento: em geral, frascos e canetas fechados ficam na geladeira (sem congelar) e a insulina em uso fica em temperatura ambiente, longe de calor e sol, pelo prazo indicado.', 'Fazer rodízio dos locais de aplicação ajuda a preservar a pele e a absorção.'],
        keyPoint: 'Dúvidas sobre técnica de aplicação? Leve-as para a próxima consulta.',
      },
    ],
    quiz: [
      { question: 'Insulina pode ser congelada?', options: ['Sim', 'Não'], correctIndex: 1, explanation: 'A insulina não deve ser congelada. Siga as orientações de armazenamento da bula e da equipe.' },
      { question: 'Por que fazer rodízio dos locais de aplicação?', options: ['Para preservar a pele e a absorção', 'Não faz diferença'], correctIndex: 0, explanation: 'O rodízio ajuda a evitar alterações na pele que podem prejudicar a absorção.' },
    ],
  },
  {
    id: 'feet', topic: 'feet', title: 'Cuidados com os pés', minutes: 2, level: 'cuidados', tone: 'green',
    summary: 'Um hábito simples e muito importante.',
    cards: [
      {
        title: 'Olhe seus pés todos os dias',
        body: ['O diabetes pode diminuir a sensibilidade e a circulação nos pés ao longo do tempo. Pequenos machucados podem passar despercebidos.', 'Observe diariamente: cortes, bolhas, vermelhidão, calos ou mudanças de cor. Use um espelho ou peça ajuda se precisar.'],
        keyPoint: 'Viu algo diferente nos pés? Fale com sua equipe de saúde.',
      },
      {
        title: 'No dia a dia',
        body: ['Lave e seque bem, principalmente entre os dedos. Hidrate a pele, mas não entre os dedos.', 'Use calçados confortáveis e verifique o interior antes de calçar. Evite andar descalço.', 'Peça para examinar os pés nas consultas.'],
        keyPoint: 'Prevenção é o melhor cuidado.',
      },
    ],
    quiz: [
      { question: 'Com que frequência é bom olhar os pés?', options: ['Todos os dias', 'Uma vez por ano'], correctIndex: 0, explanation: 'A observação diária ajuda a perceber cedo qualquer alteração.' },
      { question: 'Onde NÃO passar hidratante?', options: ['No calcanhar', 'Entre os dedos'], correctIndex: 1, explanation: 'Entre os dedos a umidade pode favorecer micoses. Seque bem essa região.' },
    ],
  },
  {
    id: 'appointment', topic: 'appointment', title: 'Aproveitando a consulta médica', minutes: 2, level: 'rotina', tone: 'blue',
    summary: 'Como chegar preparado e sair com respostas.',
    cards: [
      {
        title: 'Antes da consulta',
        body: ['Anote suas dúvidas ao longo das semanas — é fácil esquecer na hora. Use “Perguntas para meu médico” no DiaBem.', 'Leve exames recentes, a lista de medicamentos e seus registros. O “Preparar consulta” junta tudo em um resumo.'],
        keyPoint: 'Três perguntas bem escolhidas valem mais do que tentar lembrar tudo na hora.',
      },
      {
        title: 'Durante e depois',
        body: ['Peça para explicar de novo se algo não ficou claro. Anote as orientações e as próximas datas.', 'Registre a próxima consulta no app para receber um lembrete.'],
        keyPoint: 'Você faz parte da equipe do seu cuidado.',
      },
    ],
    quiz: [
      { question: 'O que ajuda a aproveitar melhor a consulta?', options: ['Anotar dúvidas antes', 'Não levar exames'], correctIndex: 0, explanation: 'Anotar dúvidas e levar exames e registros torna a conversa mais produtiva.' },
    ],
  },
  {
    id: 'exams', topic: 'exams', title: 'Exames: o que é a HbA1c?', minutes: 2, level: 'rotina', tone: 'teal',
    summary: 'Entenda o exame que mostra o “quadro geral”.',
    cards: [
      {
        title: 'Hemoglobina glicada',
        body: ['A HbA1c (hemoglobina glicada) reflete, de forma aproximada, a média da glicose dos últimos 2 a 3 meses.', 'Ela complementa os registros do dia a dia: um mostra o detalhe, o outro mostra o quadro geral.'],
        keyPoint: 'A interpretação do exame e a sua meta são definidas com o médico.',
      },
      {
        title: 'Outros exames comuns',
        body: ['No acompanhamento do diabetes, é comum pedir exames de colesterol, triglicerídeos, função dos rins (como creatinina e microalbuminúria), exame de fundo de olho e avaliação dos pés.', 'Guarde seus laudos no DiaBem para ver a evolução ao longo do tempo.'],
        keyPoint: 'O app guarda e mostra a evolução — quem interpreta é a sua equipe.',
      },
    ],
    quiz: [
      { question: 'A HbA1c reflete aproximadamente…', options: ['A glicose de agora', 'A média dos últimos 2 a 3 meses', 'A glicose de 1 ano atrás'], correctIndex: 1, explanation: 'A HbA1c reflete aproximadamente a média da glicose dos últimos 2 a 3 meses.' },
    ],
  },
  {
    id: 'school', topic: 'school', title: 'Diabetes na escola', titleChild: 'Diabetes na escola', minutes: 2, level: 'rotina', tone: 'amber',
    summary: 'Como deixar a escola preparada.',
    cards: [
      {
        title: 'Comunicação com a escola',
        body: ['Converse com a direção e os professores sobre o diabetes, os sinais de glicose baixa e alta e o plano combinado com a equipe de saúde.', 'Combine onde ficam o glicosímetro, a insulina (se houver) e o lanche, e quem pode ajudar.'],
        bodyChild: ['Seus professores podem saber sobre o seu diabetes para ajudar quando precisar.', 'Você pode medir a glicose e lanchar quando precisar — isso faz parte do seu cuidado.'],
        keyPoint: 'Um plano escrito, compartilhado com a escola, traz segurança para todos.',
      },
    ],
    quiz: [
      { question: 'Quem pode conhecer o plano de cuidados na escola?', options: ['Professores e direção', 'Ninguém'], correctIndex: 0, explanation: 'Compartilhar o plano com a escola ajuda a agir rápido quando necessário.' },
    ],
  },
  {
    id: 'travel', topic: 'travel', title: 'Viagens com tranquilidade', minutes: 2, level: 'rotina', tone: 'teal',
    summary: 'Checklist simples para viajar.',
    cards: [
      {
        title: 'Antes de sair',
        body: ['Leve medicamentos e insumos a mais do que o necessário e mantenha-os na bagagem de mão em viagens de avião.', 'Tenha consigo a receita ou relatório médico, a lista de medicamentos e um lanche.', 'Mudanças de fuso horário podem exigir ajustes nos horários: combine com sua equipe antes.'],
        keyPoint: 'Deixe a tela de Emergência do DiaBem atualizada antes de viajar.',
      },
    ],
    quiz: [
      { question: 'Onde levar a insulina em viagens de avião?', options: ['Na bagagem despachada', 'Na bagagem de mão'], correctIndex: 1, explanation: 'Na bagagem de mão, os insumos ficam com você e protegidos de temperaturas extremas.' },
    ],
  },
];

export const getLesson = (id: string) => LESSONS.find((l) => l.id === id);

/** Aula do dia: muda diariamente, priorizando as não concluídas. */
export function lessonOfTheDay(completed: Set<string>): (typeof LESSONS)[number] {
  const pending = LESSONS.filter((l) => !completed.has(l.id));
  const pool = pending.length ? pending : LESSONS;
  const day = Math.floor(Date.now() / 86400000);
  // começa pela aula de carboidratos, conforme a proposta original
  const start = pool.findIndex((l) => l.id === 'carbs');
  return pool[((start < 0 ? 0 : start) + day) % pool.length];
}
