# Oliver Fit — Orquestração completa do projeto

Este arquivo é o plano de execução fase a fase para concluir o Oliver Fit por completo (v1 = Fases 0 a 9). Ele complementa o `CLAUDE.md` (regras invioláveis, contexto de produto) — leia `CLAUDE.md` e a pasta `docs/` antes de começar qualquer fase, se ainda não tiver feito nesta sessão.

## Como usar este arquivo

1. Execute as fases **em ordem**. Cada fase declara suas dependências — não pule uma fase cujo pré-requisito não esteja marcado como concluído.
2. Cada fase tem um **checklist de entregáveis** (marque `[x]` conforme for concluindo, direto neste arquivo — é assim que o progresso persiste entre sessões/loops) e **critérios de aceite** (não marque a fase como concluída sem passar por eles).
3. Cada fase termina com um **prompt de instrução** pronto — é o texto a colar/enviar ao agente do Claude Code para executar aquela fase especificamente.
4. Ao final de cada fase: **commit** com mensagem clara (`feat(fase-N): <resumo>`), e atualize os checkboxes deste arquivo antes de seguir pra próxima.

### Regras globais de execução em loop

- `CLAUDE.md` tem prioridade sobre qualquer coisa neste arquivo em caso de conflito.
- **Copy/textos:** pode escrever um rascunho de texto (onboarding, empty states, mensagens) respeitando o tom e a lista de proibições em `docs/design-tokens.json` (`design_style.brand_voice_in_ui`). Marque com um comentário `// TODO(copy): revisar com o usuário` — isso não deve travar o loop, mas precisa ficar visível.
- **Assets de marca reais** (ícone final, splash) — se não fornecidos, use o placeholder simples gerado na Fase 0 e não trave a fase por isso. Marque como pendência.
- **Qualquer decisão de arquitetura, backend ou produto que não esteja em `CLAUDE.md`/`docs/`** — pare e pergunte ao usuário. Não assuma.
- Ao final de qualquer tela ou componente novo, rode a skill `/oliver-fit-design-review` antes de marcar o item como concluído.
- Em toda tarefa de código, aplique a skill `ponytail` em nível `full`: a solução mínima que atende integralmente ao requisito, sem abstrações ou dependências especulativas.
- Ao concluir tecnicamente cada fase, faça o commit da fase, abra a versão local para uma sessão de avaliação visual do Yan e aguarde aprovação explícita antes de iniciar a fase seguinte. Ajustes pedidos nessa revisão recebem um commit complementar da mesma fase.
- Nunca introduza uma dependência paga sem avisar e esperar confirmação (regra já em `CLAUDE.md`).

---

## Fase 0 — Fundação técnica e scaffold

**Depende de:** nada (scaffold parcial já existe: `package.json`, `vite.config.ts` com PWA configurado)

### Checklist de entregáveis
- [x] Confirmar `node_modules` instalado e `npm run dev` funcionando
- [x] Criar estrutura de pastas: `src/components/ui`, `src/components/features`, `src/pages`, `src/lib`, `src/hooks`, `src/types`, `src/styles`
- [x] Configurar `tailwind.config.js` com o tema estendido a partir de `docs/design-tokens.json` (cores, raios, tipografia, espaçamento) — nada de cor `indigo-*`/`zinc-*`/`slate-*` sobrevivendo
- [x] Remover o conteúdo padrão do template Vite em `src/App.tsx` e `src/App.css`; substituir por um shell com `react-router-dom` (rotas vazias por enquanto)
- [x] Gerar ícones PWA placeholder (`public/pwa-192x192.png`, `public/pwa-512x512.png`) — simples, cor de fundo `#007AFF`, iniciais "OF" — só pra não quebrar o manifest; marcar como placeholder a substituir na Fase 8
- [x] Confirmar `npm run build` completa sem erro

### Critérios de aceite
- `npm run dev` e `npm run build` funcionam sem erro
- Manifest do PWA válido (ícones existem nos tamanhos declarados)
- Nenhum resquício do template padrão do Vite (logos, contador) em `src/`
- Classes Tailwind usadas em qualquer teste manual refletem os tokens (ex.: cor de destaque é o azul dos tokens, não um azul genérico do Tailwind)

### Prompt para o agente

```
Trabalhe na Fase 0 do ORQUESTRACAO.md do Oliver Fit. Leia CLAUDE.md e docs/design-tokens.json
antes de começar. Complete o checklist de entregáveis da Fase 0: organize a estrutura de pastas
em src/, configure o tailwind.config.js para usar exatamente os tokens de
docs/design-tokens.json (cor, tipografia, raio, espaçamento) — nenhuma cor padrão do
Tailwind/shadcn pode sobreviver sem remapeamento. Limpe o template padrão do Vite em App.tsx/
App.css e monte um shell de rotas com react-router-dom. Gere ícones PWA placeholder simples
(192x192 e 512x512, fundo #007AFF, iniciais "OF") em public/ para o manifest não quebrar.
Confirme que `npm run dev` e `npm run build` funcionam sem erro. Ao terminar, marque os
checkboxes da Fase 0 neste arquivo e faça commit com a mensagem "feat(fase-0): fundação
técnica e scaffold".
```

---

## Fase 1 — Supabase: schema, client e autenticação

**Depende de:** Fase 0
**Bloqueio conhecido:** esta fase exige que o projeto Supabase já exista e que `.env.local` tenha valores reais (não os placeholders de `.env.example`) e que o provedor Google OAuth esteja habilitado no Supabase Auth — **isso é ação do usuário, não do agente**. Se `.env.local` não existir ou tiver valores vazios, **pare esta fase e peça ao usuário para completar a criação do projeto Supabase antes de continuar.**

### Checklist de entregáveis
- [ ] Confirmar `.env.local` preenchido (não prosseguir sem isso)
- [ ] Rodar `docs/schema.sql` no projeto Supabase (via SQL Editor do painel, ou `supabase db push` se o CLI estiver instalado e o projeto linkado)
- [ ] Criar `src/lib/supabase.ts` (client tipado, usando as variáveis de ambiente)
- [ ] Gerar/escrever tipos TypeScript das 11 tabelas em `src/types/database.ts`, batendo com `docs/schema.sql`
- [ ] Implementar fluxo de login com Google (`supabase.auth.signInWithOAuth`) e um hook `useAuth`
- [ ] Implementar wrapper de rota protegida (redireciona pra login se não autenticado)
- [ ] Tela de onboarding mínima: altura, peso inicial, meta de peso, metas diárias de calorias/macros — grava em `profiles`

### Critérios de aceite
- Login com Google funciona de ponta a ponta (testado manualmente pelo usuário)
- Um registro em `profiles` é criado/atualizado após o onboarding
- Rotas protegidas redirecionam corretamente sem sessão
- RLS do Supabase não bloqueia o próprio usuário (testar leitura/escrita autenticada)

### Prompt para o agente

```
Trabalhe na Fase 1 do ORQUESTRACAO.md do Oliver Fit. ANTES de qualquer coisa, confira se
.env.local existe e tem valores reais preenchidos (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY,
VITE_GOOGLE_CLIENT_ID). Se estiver vazio ou não existir, PARE e peça ao usuário para criar o
projeto Supabase e preencher essas variáveis antes de continuar — não invente valores.
Se as variáveis existirem: rode docs/schema.sql contra o projeto Supabase (oriente o usuário
a colar no SQL Editor do painel, ou use `supabase db push` se o projeto já estiver linkado
localmente). Depois, crie src/lib/supabase.ts com o client tipado, gere os tipos TypeScript das
11 tabelas em src/types/database.ts a partir de docs/schema.sql, implemente login com Google
via supabase.auth.signInWithOAuth, um hook useAuth, um wrapper de rota protegida, e uma tela de
onboarding mínima (altura, peso inicial, meta de peso, metas diárias de calorias/macros)
gravando em profiles. Rode /oliver-fit-design-review na tela de onboarding antes de fechar.
Ao terminar, marque os checkboxes da Fase 1 e faça commit "feat(fase-1): supabase, auth e
onboarding".
```

---

## Fase 2 — Design system aplicado e componentes base

**Depende de:** Fase 0

### Checklist de entregáveis
- [ ] Buscar cada componente listado em `docs/componentes-21st.md` pelo nome exato (via MCP/CLI do 21st Labs se configurado, senão manualmente em 21st.dev)
- [ ] Adaptar cada componente importado aos tokens do Oliver Fit (cor, raio — nunca deixar o componente "como veio")
- [ ] Montar biblioteca local em `src/components/ui`: Button (primário/secundário/ghost), Card (sólido e glass), Input, BottomSheet, TabBar ("Bottom menu", não "Dock"), List (inset grouped estilo Ajustes)
- [ ] Implementar o shell de navegação: tab bar inferior fixa com glass, itens: Home/Trilha, Treino, Dieta, Progresso, Perfil
- [ ] Rodar `/oliver-fit-design-review` na biblioteca de componentes antes de fechar a fase

### Critérios de aceite
- Nenhum componente com cor/raio padrão do shadcn sobrevivendo
- Tab bar navega entre placeholders de tela (mesmo vazios) sem erro
- Skill de design review sem pendência crítica aberta

### Prompt para o agente

```
Trabalhe na Fase 2 do ORQUESTRACAO.md do Oliver Fit. Leia docs/componentes-21st.md e busque
cada componente listado pelo nome exato (via MCP/CLI do 21st.dev se disponível, senão em
21st.dev manualmente). Adapte cada um aos tokens de docs/design-tokens.json — remapeie cor e
raio, não deixe nenhum componente com os defaults do shadcn/Tailwind. Monte a biblioteca local
em src/components/ui com Button, Card (versão sólida e versão glass), Input, BottomSheet,
TabBar (use "Bottom menu", não componentes de "Dock") e List no estilo inset grouped da Apple.
Monte o shell de navegação com a tab bar inferior fixa (glass) e os itens Home/Trilha, Treino,
Dieta, Progresso, Perfil, ligando a rotas placeholder. Rode /oliver-fit-design-review em tudo
antes de terminar. Marque os checkboxes da Fase 2 e faça commit "feat(fase-2): design system
aplicado e componentes base".
```

---

## Fase 3 — Elemento-assinatura: trilha de progresso

**Depende de:** Fase 1 (dados/auth), Fase 2 (componentes base)

### Checklist de entregáveis
- [ ] Queries de leitura/escrita em `trail_days` (Supabase)
- [ ] Componente de caminho serpenteado vertical (SVG customizado), um nó por dia
- [ ] Três estados visuais do nó: bloqueado (cinza) / disponível hoje (azul + pulso) / concluído (azul preenchido + check) — conforme `signature_elements.trail_path` em `docs/design-tokens.json`
- [ ] Consumo da view `v_current_streak` pra exibir a sequência atual
- [ ] Tela Home = a trilha como ponto de entrada do app

### Critérios de aceite
- A trilha renderiza o caminho serpenteado (não uma lista reta) com os três estados visuais corretos
- O nó de "hoje" é visualmente distinguível dos demais
- Streak exibido bate com os dias `day_completed = true` consecutivos mais recentes
- Dados vêm do Supabase, não são mockados

### Prompt para o agente

```
Trabalhe na Fase 3 do ORQUESTRACAO.md do Oliver Fit. Esta é uma peça de elemento-assinatura —
leia signature_elements.trail_path em docs/design-tokens.json antes de começar, a forma exata
já está decidida (caminho serpenteado vertical estilo Duolingo, não linha reta, não mapa).
Implemente as queries de trail_days no Supabase, construa o componente SVG customizado do
caminho serpenteado com um nó por dia e os três estados (bloqueado/disponível hoje/concluído)
exatamente como descrito nos tokens. Consuma a view v_current_streak para mostrar a sequência
atual. Torne essa trilha a tela Home do app. Rode /oliver-fit-design-review antes de terminar,
prestando atenção especial ao item 7 do checklist (elementos-assinatura). Marque os checkboxes
da Fase 3 e faça commit "feat(fase-3): trilha de progresso".
```

---

## Fase 4 — Módulo Treinos

**Depende de:** Fase 1, Fase 2

### Checklist de entregáveis
- [ ] CRUD de exercícios próprios (`exercises`)
- [ ] Montagem de planos de treino (`workout_plans` + `workout_plan_exercises`) e agenda semanal (`workout_schedule`)
- [ ] Tela "treino do dia": lista de exercícios do plano do dia, log de séries (reps, carga) gravando em `set_logs`, cronômetro de descanso
- [ ] Ao concluir o treino: `workout_sessions.status = 'completed'` e atualizar `trail_days.workout_completed`
- [ ] Histórico de evolução de carga por exercício (gráfico simples)
- [ ] Anel de atividade (versão Oliver Fit, ver `signature_elements.activity_ring`) mostrando progresso do treino do dia

### Critérios de aceite
- Consigo cadastrar um exercício, montar um plano, executá-lo e ver o histórico
- Ao concluir o treino do dia, `trail_days.workout_completed` fica `true` automaticamente
- Cargas gravadas em `NUMERIC`, sem perda de precisão em somas/médias do histórico

### Prompt para o agente

```
Trabalhe na Fase 4 do ORQUESTRACAO.md do Oliver Fit. Implemente o CRUD de exercícios próprios,
a montagem de planos de treino (workout_plans, workout_plan_exercises) e a agenda semanal
(workout_schedule). Construa a tela "treino do dia": lista de exercícios do plano do dia, log
de séries com reps e carga gravando em set_logs, cronômetro de descanso entre séries. Ao
concluir o treino, marque workout_sessions.status como 'completed' e atualize
trail_days.workout_completed para true no mesmo dia. Adicione histórico de evolução de carga
por exercício (gráfico simples). Use o anel de atividade adaptado (signature_elements.
activity_ring em docs/design-tokens.json, não o Apple Activity Ring puro) para mostrar o
progresso do treino do dia. Rode /oliver-fit-design-review antes de terminar. Marque os
checkboxes da Fase 4 e faça commit "feat(fase-4): módulo treinos".
```

---

## Fase 5 — Módulo Dieta

**Depende de:** Fase 1, Fase 2

### Checklist de entregáveis
- [ ] Registro manual de refeição (nome, quantidade, calorias, macros) gravando em `meals`
- [ ] Tela "dieta do dia": cards de refeição estilo CalAI (referência visual, não funcional), anéis de macro comparando consumido x meta
- [ ] Consumo da view `v_daily_nutrition_status` para calcular e persistir `trail_days.diet_completed`
- [ ] Metas diárias editáveis no perfil (`daily_calorie_goal`, `daily_protein_goal_g`, etc.)

### Critérios de aceite
- Registro de refeição funciona e reflete no total do dia
- Macros calculados sem arredondamento intermediário (conferir que os campos são `NUMERIC`, não `FLOAT`)
- `trail_days.diet_completed` fica `true` só quando a regra fechada é satisfeita (3+ refeições E calorias entre 90-110% da meta)

### Prompt para o agente

```
Trabalhe na Fase 5 do ORQUESTRACAO.md do Oliver Fit. Implemente o registro manual de refeição
(nome, quantidade, calorias, macros) gravando em meals. Construa a tela "dieta do dia" com
cards de refeição no estilo visual do CalAI (só referência visual — cards limpos, tipografia
grande para números, anéis de macro) e anéis comparando consumido x meta, usando o anel de
atividade adaptado do Oliver Fit. Consuma a view v_daily_nutrition_status para calcular
diet_completed e faça upsert em trail_days.diet_completed. Adicione tela/seção para editar as
metas diárias no perfil. Confira que nenhum cálculo de macro usa arredondamento intermediário
— os campos numéricos do schema já são NUMERIC, não introduza FLOAT em nenhum lugar do código.
Rode /oliver-fit-design-review antes de terminar. Marque os checkboxes da Fase 5 e faça commit
"feat(fase-5): módulo dieta".
```

---

## Fase 6 — Dashboard

**Depende de:** Fase 3, Fase 4, Fase 5

### Checklist de entregáveis
- [ ] Tela de resumo do dia: status do treino, calorias restantes, streak da trilha
- [ ] Cards de estatística (Health Stat Card / Stats Card / Progress Metric Card, adaptados aos tokens)

### Critérios de aceite
- Dashboard reflete dados reais de treino/dieta/trilha do dia atual, sem mock

### Prompt para o agente

```
Trabalhe na Fase 6 do ORQUESTRACAO.md do Oliver Fit. Construa a tela de dashboard: resumo do
dia com status do treino (feito/pendente), calorias restantes até a meta, e a streak atual da
trilha. Use os cards de estatística mapeados em docs/componentes-21st.md (Health Stat Card,
Stats Card, Progress Metric Card), adaptados aos tokens do Oliver Fit. Todos os dados vêm de
consultas reais ao Supabase (trail_days, meals, workout_sessions do dia atual) — nada mockado.
Rode /oliver-fit-design-review antes de terminar. Marque os checkboxes da Fase 6 e faça commit
"feat(fase-6): dashboard".
```

---

## Fase 7 — Medidas e progresso

**Depende de:** Fase 1, Fase 2

### Checklist de entregáveis
- [ ] CRUD de `measurements` (peso, medidas corporais)
- [ ] Upload de fotos de progresso pro Supabase Storage + registro em `progress_photos`
- [ ] Gráfico de evolução de peso/medidas ao longo do tempo
- [ ] Galeria de fotos com comparação por data

### Critérios de aceite
- Consigo registrar peso/medida numa data, subir uma foto, e ver o gráfico de evolução refletindo os dados reais

### Prompt para o agente

```
Trabalhe na Fase 7 do ORQUESTRACAO.md do Oliver Fit. Implemente o CRUD de measurements (peso e
medidas corporais por data) e o upload de fotos de progresso para o Supabase Storage, com o
caminho registrado em progress_photos.storage_path. Construa um gráfico de evolução de peso/
medidas ao longo do tempo (componente Line Chart mapeado em docs/componentes-21st.md) e uma
galeria de fotos organizável por data, com comparação lado a lado entre duas datas. Rode
/oliver-fit-design-review antes de terminar. Marque os checkboxes da Fase 7 e faça commit
"feat(fase-7): medidas e progresso".
```

---

## Fase 8 — Finalização do PWA e notificações

**Depende de:** Fases 3 a 7 substancialmente prontas

### Checklist de entregáveis
- [ ] Substituir os ícones placeholder da Fase 0 por assets de marca reais (se já fornecidos pelo usuário; senão, manter o placeholder e marcar pendência explícita)
- [ ] Implementar Web Push (service worker, pedido de permissão, lembretes de treino/dieta)
- [ ] Aviso visível no onboarding sobre a limitação de push no iOS (precisa estar instalado via "Adicionar à Tela de Início", iOS 16.4+)
- [ ] Testar instalação via "Adicionar à Tela de Início" em iOS e Android
- [ ] Revisar `manifest.json` / configuração do `vite-plugin-pwa` por completo

### Critérios de aceite
- App instalável nos dois sistemas operacionais
- Notificação de teste funciona (dentro da limitação conhecida do iOS)
- Nenhum ícone ou asset quebrado no manifest

### Prompt para o agente

```
Trabalhe na Fase 8 do ORQUESTRACAO.md do Oliver Fit. Se o usuário já forneceu assets de marca
reais (ícone final, splash), substitua os placeholders da Fase 0; senão, mantenha o placeholder
e deixe isso marcado como pendência explícita no final do relatório desta fase, não invente um
design novo sozinho. Implemente Web Push: service worker, pedido de permissão, e lembretes de
treino/dieta. Adicione um aviso claro no onboarding sobre a limitação de notificação push no
iOS (só funciona se o app estiver instalado via "Adicionar à Tela de Início" e com iOS 16.4+).
Revise o manifest.json/configuração do vite-plugin-pwa por completo. Teste (ou documente como
testar) a instalação via "Adicionar à Tela de Início" em iOS e Android. Marque os checkboxes
da Fase 8 e faça commit "feat(fase-8): pwa e notificações".
```

---

## Fase 9 — QA final

**Depende de:** todas as fases anteriores

### Checklist de entregáveis
- [ ] Definir e rodar critérios de aceite por tela (se ainda não definidos, derive-os a partir dos critérios de aceite de cada fase acima e liste explicitamente por tela)
- [ ] Rodar `/oliver-fit-design-review` em todas as telas do app, não só nas mais recentes
- [ ] `npm run build` final sem erros/warnings relevantes
- [ ] Teste de instalação e uso em pelo menos um dispositivo real (iOS ou Android)
- [ ] Checagem básica de performance (Lighthouse PWA score)

### Critérios de aceite
- Build limpo
- Todas as telas passam na skill de design review sem pendência crítica
- Instalação testada em pelo menos um dispositivo real
- Relatório final entregue ao usuário resumindo o que foi construído e o que ficou como pendência (se algo ficou)

### Prompt para o agente

```
Trabalhe na Fase 9 do ORQUESTRACAO.md do Oliver Fit — é a fase final de QA. Percorra todas as
telas do app (não só as mais recentes) e rode /oliver-fit-design-review em cada uma. Derive e
liste critérios de aceite por tela a partir dos critérios de aceite de cada fase deste arquivo,
e confirme cada um. Rode npm run build e resolva qualquer erro ou warning relevante. Teste (ou
documente passo a passo como testar) a instalação via "Adicionar à Tela de Início" em um
dispositivo real. Rode uma checagem básica de performance (Lighthouse, se disponível). Ao
final, escreva um relatório resumindo o que foi construído fase a fase e o que ficou como
pendência conhecida (se algo ficou). Marque os checkboxes da Fase 9 e faça commit
"feat(fase-9): qa final e fechamento do v1".
```

---

## Fora de escopo (Fase 4 do roadmap original / backlog)

Reconhecimento de alimento por foto, Apple Sign-In, Apple Watch — **não implementar nada disso sem pedido explícito e novo do usuário**, mesmo que pareça uma extensão natural de uma fase acima. Essa regra já está em `CLAUDE.md`, seção 8.
