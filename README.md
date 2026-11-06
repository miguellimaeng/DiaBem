# DiaBem

Companheiro diário para organização, educação e acompanhamento da rotina de pessoas com diabetes tipo 1 e tipo 2.
Progressive Web App (PWA): abre por URL, funciona offline e instala na tela inicial — **sem App Store e sem Google Play**.

> O DiaBem organiza registros e oferece conteúdo educativo. Ele **não** diagnostica, **não** prescreve, **não** calcula doses de insulina e **não** substitui a equipe de saúde.

---

## O que já funciona (1ª entrega + boa parte da 2ª)

| Área | Recursos |
|---|---|
| **Onboarding** | Sem conta. Nome, tipo de diabetes, quem usa (pessoa/cuidador), modo de experiência, consentimento LGPD, dados de demonstração opcionais |
| **Início** | Saudação, última glicose e estado em relação à faixa *do usuário*, média 7 dias, rotina registrada, registros do dia, atividade, atalhos “Registrar agora”, missão educativa do dia, próxima consulta + “Preparar consulta” |
| **Meu Dia** | Linha do tempo unificada (glicose, refeições, insulina, medicamentos, atividade, humor, sono/eventos), navegação por dia, checklist de rotina, editar tocando no item |
| **Glicose** | Registro em mg/dL ou mmol/L, contexto, data/hora, observação. Gráfico (Hoje/7/30/90/personalizado), média, mín., máx., nº de medições, tendência, filtro por momento, distribuição e % dentro da faixa **configurada pelo usuário/profissional** (sem faixa padrão) |
| **Alimentação** | Registro em 4 passos (tipo → descrição/carboidratos opcionais → foto → observação), histórico com fotos, receitas por categoria, favoritos (receitas e refeições “repetir”), área educativa |
| **Receitas** | Ilustração, tempo, dificuldade, ingredientes, preparo. Informação nutricional só com fonte confiável — nas receitas demo é exibido que não há dados, sem números inventados |
| **Insulina** | Registro (basal/bolus/outro, nome, dose aplicada, unidade). Nunca calcula ou sugere dose |
| **Medicamentos** | Cadastro (nome, dose, horários, frequência, lembrete, “mostrar na emergência”), rotina de hoje com Tomado / Adiado / Não tomado |
| **Atividade / Como estou** | Tipo, duração, intensidade; humor + sintomas |
| **Saúde** | Exames (PDF/JPG/PNG/foto, histórico), indicadores (HbA1c, LDL…) com gráfico de evolução, consultas com lembrete, perguntas para o médico, estatísticas sem julgamento, emergência |
| **Preparar consulta / Relatório** | Período 7/30/90/personalizado; glicose, médias por momento, medicamentos, insulina, refeições, atividade, sintomas, exames, observações e perguntas. **Imprimir / salvar como PDF** e **exportar CSV** (compatível com Excel pt‑BR) |
| **Aprender** | 15 aulas curtas com cartões, versão em linguagem infantil, quiz com explicação, progresso, missão do dia e conquistas **apenas por ações positivas** |
| **Perfil** | Modo Adulto/Criança/Fácil, tamanho do texto, reduzir animações, unidade, faixa, lembretes, instalar app, exportar tudo (JSON com arquivos), carregar/remover demo, apagar tudo |
| **PWA** | Manifest, ícones (inclui maskable), atalhos “Registrar glicose” e “Emergência”, service worker com cache do app (testado: recarrega offline) |

### Novidades da versão 0.2
- **Importar arquivo** (no primeiro acesso ou em Perfil): arquivo de configuração `diabem-setup` preparado por um familiar ou profissional, ou backup completo exportado pelo app. Nada existente é apagado.
- **Esquema de insulina da receita** (Saúde → Medicamentos): transcrição por momento do dia, com selo “Conferido na receita” ou “Confirmar na receita”. No registro de insulina, a pessoa toca na aplicação da receita e confirma a dose aplicada. O app continua sem calcular, sugerir ou ajustar doses.
- **Exames transcritos** podem ser marcados como “verificar laudo”; novos indicadores eTFG, sódio e potássio.
- **Histórico informado**: relatos e resumos ficam separados dos registros e dos laudos, com o grau de confirmação (documento / relatado / pendente), e aparecem no relatório da consulta.

#### Formato do arquivo de configuração
```json
{
  "format": "diabem-setup", "version": 1,
  "profile": { "name": "…", "diabetesType": "type2", "historyNotes": [{ "title": "…", "text": "…", "evidence": "reported" }] },
  "settings": { "mode": "easy", "fontSize": "lg", "glucoseUnit": "mg/dL" },
  "insulinPlan": [{ "kind": "basal", "name": "NPH", "moment": "before_breakfast", "doseUnits": 0, "confirmed": false }],
  "examResults": [{ "indicator": "hba1c", "value": 0, "unit": "%", "date": "AAAA-MM-DD", "verified": false }],
  "questions": [{ "text": "…" }],
  "emergency": { "name": "…", "importantMeds": "…", "contacts": [] }
}
```
Arquivos com dados reais de pacientes **não** devem ser colocados no repositório do app.

### Modos de experiência
- **Adulto** — padrão.
- **Criança** — mesmos dados, linguagem simplificada (textos alternativos nas aulas e botões), missões e conquistas em destaque, tom visual levemente mais lúdico.
- **Fácil** — fonte ~22% maior, toques de 56px, 2 colunas, menos atalhos, navegação com 5 abas, mais contraste.

---

## Executar

Requisitos: **Node 18+**.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # gera dist/ (faz type-check antes)
npm run preview    # serve dist/ em http://localhost:4173 — testa a instalação e o offline
```

O service worker só é registrado no build de produção (`npm run build` + `npm run preview`), para não atrapalhar o desenvolvimento.

Para testar no celular na mesma rede: `npm run dev -- --host` e abra o IP mostrado. (Instalação como PWA exige HTTPS, ou `localhost`.)

---

## Deploy

O build é um site estático em `dist/`. O roteamento usa hash (`/#/glicose`), então **não precisa configurar rewrites** em nenhum provedor.

**Vercel** — importe o repositório; `vercel.json` já define `npm run build` e a pasta `dist`.

**Netlify** — importe o repositório; `netlify.toml` já está configurado. Ou arraste a pasta `dist/` em app.netlify.com/drop.

**Cloudflare Pages** — Build command `npm run build`, output `dist`. O arquivo `public/_headers` evita cache agressivo do `sw.js`.

**Servidor comum (Apache/Nginx)** — copie o conteúdo de `dist/` para a pasta pública. Garanta HTTPS e, de preferência, `Cache-Control: no-cache` para `/sw.js`.

Depois do deploy o usuário abre `https://meudominio.com` e:
- **Android (Chrome):** menu ⋮ → *Instalar app* (ou o botão “Instalar na tela inicial” em Perfil).
- **iPhone (Safari):** Compartilhar → *Adicionar à Tela de Início*.

Para publicar uma nova versão e forçar atualização do cache, altere `CACHE_VERSION` em `public/sw.js`.

---

## Arquitetura

```
src/
  app/            AppContext (configurações, perfil, toast, folha de registro), router por hash, useData (consultas reativas), lembretes
  components/     Icon (vetoriais, padrão Lucide), Illustration (SVG flat), ui/ (design system), charts/, layout/AppShell
  config/         app.config.ts (nome/identidade), categories.ts (cores, ícones e rótulos por categoria)
  database/       db.ts (IndexedDB), repositories.ts (única porta de dados), demoSeed.ts
  features/
    home  day  glucose  food  insulin  medications  activity  mood
    health  exams  appointments  reports  emergency  education  statistics  profile
  services/       export (JSON/CSV), pwa, reminders, sync/SyncAdapter, integrations/(GlucoseSource, FoodPhotoAnalyzer), sharing/caregiver
  styles/         tokens.css (design tokens + modos), base.css, components.css
  types/models.ts Modelo de dados completo
  utils/          datas, glicose (conversão, estatísticas), imagem, formatação
```

**Princípios**
- As telas nunca acessam o IndexedDB diretamente — tudo passa por `repo.*`. Trocar/estender por backend é uma mudança localizada.
- Todo registro tem `id`, `createdAt`, `updatedAt`, `syncStatus` (`local`/`pending`/`synced`/`conflict`), `deletedAt` (soft delete) e `source` (manual, demo, dexcom, libre…).
- Glicose é armazenada sempre em mg/dL (`valueMgdl`) junto do valor e unidade digitados.
- Sem dependências de runtime além de React — ícones, gráficos e banco são próprios, leves e funcionam offline.

### Modelo de dados (`src/types/models.ts`)
`UserProfile`, `AppSettings` (modo, fonte, unidade, `targetRange` nulo por padrão, consentimento), `GlucoseRecord`, `MealRecord` (foto como Blob, `photoAnalysis` reservado), `InsulinRecord`, `Medication`, `MedicationRecord`, `ActivityRecord`, `MoodRecord`, `DayEvent`, `Exam` + `ExamAttachment`, `ExamResult`, `Appointment`, `ConsultationQuestion`, `Recipe` + `NutritionInfo`, `LearningModule`, `LearningProgress`, `AchievementUnlock`, `EmergencyProfile`, `CaregiverPermission`.

### Preparado para o futuro
| Recurso | Onde | Estado |
|---|---|---|
| Conta + sincronização (Supabase) | `services/sync/SyncAdapter.ts` | Contrato + `LocalOnlySync`; esboço `SupabaseSync` comentado |
| CGM, glicosímetro Bluetooth, Apple Saúde, Health Connect | `services/integrations/GlucoseSource.ts` | Interface + conversor para `GlucoseRecord` |
| Análise de foto de refeição | `services/integrations/FoodPhotoAnalyzer.ts` | Interface; sem IA nesta versão |
| Cuidador | `services/sharing/caregiver.ts`, store `caregivers` | Permissões por categoria, somente leitura, com validade; vazio por padrão |
| Notificações em segundo plano | `services/reminders.ts` | Hoje: lembretes enquanto o app está aberto. Web Push exige backend |
| Dark mode | `styles/tokens.css` | Tokens prontos para um tema escuro |

---

## Privacidade (LGPD)
- **Mínimo de dados:** nada é obrigatório além do aceite; nome e tipo de diabetes são opcionais.
- **Consentimento** registrado com data e versão (`settings.consent`).
- **Dados locais:** IndexedDB do navegador; o app pede armazenamento persistente.
- **Portabilidade:** Perfil → Exportar (JSON completo, incluindo fotos e laudos). Relatório → CSV.
- **Exclusão:** remover só os dados de demonstração ou apagar tudo.
- **Compartilhamento:** inexistente nesta versão; quando houver, será por categoria e controlado pelo usuário.
- **Backend futuro:** TLS, criptografia em repouso, Row Level Security no Supabase e criptografia de campos sensíveis antes do envio.

## Segurança clínica
- Sem faixa clínica universal: o usuário ou profissional define a faixa.
- Linguagem neutra (“acima/abaixo da faixa configurada”), sem vermelho de alarme, sem notas.
- Gamificação só por registrar, aprender e se organizar.
- Insulina e medicamentos: apenas registro; avisos explícitos nos formulários.
- Conteúdo educativo é geral e remete sempre ao plano da equipe. **Recomenda-se revisão por profissional de saúde antes do lançamento público.**
- Dados de demonstração sempre marcados com selo “Demo” e excluíveis dos relatórios.

## Personalizar identidade
- Nome, textos e números de emergência: `src/config/app.config.ts`
- Cores e tipografia: `src/styles/tokens.css`
- Nome/cor do app instalado: `public/manifest.webmanifest` e `index.html` (`theme-color`, `title`)
- Ícones: `public/icons/` (substitua os PNGs mantendo os tamanhos)

## Próximos passos sugeridos
1. Revisão clínica do conteúdo educativo e das receitas (informação nutricional com base na TACO, calculada por nutricionista).
2. Testes com usuários reais de cada perfil (criança + responsável, adulto, idoso).
3. Terceira etapa: Supabase (auth opcional, sync, storage de laudos), Web Push, compartilhamento com cuidador.
4. Exportação de PDF nativa (hoje via “Imprimir → Salvar como PDF”), dark mode, importação de backup.
