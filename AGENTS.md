# Oliver Fit — Contexto do projeto

Este arquivo é lido automaticamente pelo Codex no início de cada sessão. Ele é um **índice de decisões e regras invioláveis** — os documentos completos ficam em `docs/`, referenciados abaixo. Não duplique o conteúdo de `docs/` aqui; leia o arquivo referenciado quando precisar do detalhe.

## 1. Visão geral

Oliver Fit é um app de organização e acompanhamento de treinos e dieta, de uso **pessoal e individual** (só o Yan usa, sem previsão de multiusuário). Design em estilo Apple (limpo, HIG), com uma trilha de progresso estilo Duolingo como tela inicial. Repositório: `github.com/yan1405/Oliver-fit`.

Contexto completo de escopo e decisões de produto: `docs/plano-projeto.md`.

## 2. Stack técnica

- **Frontend:** React + Vite + TypeScript + Tailwind CSS
- **Formato de entrega: PWA (Progressive Web App)** — não é app nativo compilado. Decisão fechada e reconfirmada em 18/08/2026 depois de questionamento direto do usuário: PWA entrega experiência de app de verdade (ícone próprio, tela cheia, offline, push) sem custo de conta de desenvolvedor. **Não trocar essa arquitetura sem uma instrução explícita e nova do usuário** — já foi revisitada uma vez e mantida.
- **PWA tooling:** manifest.json + service worker (vite-plugin-pwa ou Workbox), Web Push API
- **Componentes UI:** adaptados do 21st.dev (base shadcn/ui + Tailwind) — ver seção 6
- **Backend:** Supabase — Postgres + Auth (Google OAuth) + Storage. Projeto ainda não criado; ver `.env.example` para as variáveis que faltam
- **Hospedagem:** Vercel ou Netlify (camada gratuita)

## 3. Regras invioláveis

- **Sempre aplicar a skill `ponytail` em nível `full` em qualquer tarefa de código deste projeto** — reutilizar antes de criar, preferir recursos nativos e dependências já instaladas, evitar abstrações especulativas e não simplificar segurança, acessibilidade ou requisitos explícitos.
- **Nunca** usar o tenant Azure da Crescitech (ambiente de trabalho do usuário) para qualquer recurso deste projeto, mesmo que pareça conveniente — é dado pessoal de saúde, risco de custo faturado à empresa e de mistura indevida de ambientes.
- **Nunca** implementar Sign in with Apple — exige Apple Developer Program pago (US$ 99/ano), fora do orçamento definido. Auth é **só Google Sign-In** no v1.
- **Nunca** trocar PWA por app nativo compilado sem instrução explícita nova do usuário (ver seção 2).
- **Nunca** introduzir uma dependência paga (API, serviço, biblioteca com licença) sem avisar o usuário antes e esperar confirmação — o orçamento do projeto é zero por padrão.
- Todo campo numérico de treino/dieta usa `NUMERIC` de precisão fixa no schema, nunca `FLOAT`/`REAL` — evita erro de arredondamento intermediário.

## 4. Design system

Resumo: paleta quase monocromática (azul Apple System Blue `#007AFF`, ação principal), fundo `#F2F2F7`/cards brancos no claro, `#1C1C1E` no escuro, glassmorphism na navegação e cards de destaque, sombra suave, cantos grandes (~20px), tipografia `-apple-system`/SF Pro na escala Apple HIG completa.

**Regras de acessibilidade e anti-genérico (fechadas em auditoria design-sem-cara-de-ia, 18/08/2026) — aplicar em toda tela nova:**
- Contraste de texto ≥ 4.5:1 em qualquer superfície de vidro, nos dois temas, mesmo com conteúdo em movimento atrás. Se não for garantido, adicionar camada sólida semi-opaca por trás do texto antes do blur.
- Proibido importar Lucide/Heroicons inteiro como substituto silencioso de SF Symbols — cada ícone que faltar precisa de curadoria individual (mesmo peso de traço, mesmo grid).
- Proibido qualquer cor `indigo-*`, `zinc-*` ou `slate-*` padrão do Tailwind/shadcn sobreviver sem remapeamento para os tokens do Oliver Fit.
- Copy proibida: variações de "leve [x] para o próximo nível", "tudo em um só lugar", "construa o seu melhor eu" — ver lista completa e teste de voz em `docs/design-tokens.json` (`design_style.brand_voice_in_ui`).

Tokens completos (cor, tipografia, espaçamento, forma, elevação, motion, componentes): `docs/design-tokens.json`.

## 5. Elementos-assinatura (não-negociáveis)

O app está fortemente ancorado em referências Apple — isso é correto, mas cria risco de zero identidade própria. Duas peças foram fechadas deliberadamente como "do Oliver Fit", não recorte 1:1 de referência:

- **Trilha de progresso:** caminho **serpenteado vertical**, estilo Duolingo (não linha reta, não mapa/terreno). Um nó por dia, estados: bloqueado (cinza) / disponível hoje (azul + pulso leve) / concluído (azul preenchido + check). Não existe componente pronto no 21st.dev para isso — é construção customizada.
- **Anel de atividade:** base no componente "Apple Activity Ring" (Kokonut Baffier, 21st.dev), mas com espessura ajustada e um micro-comportamento próprio ao completar (pulso ou brilho sutil) — não deixar idêntico ao Apple Fitness.

Detalhe completo: `docs/auditoria-design.md`.

## 6. Componentes 21st.dev por tela

Mapeamento completo (navegação, onboarding, home/trilha, dashboard, treinos, dieta, medidas) em `docs/componentes-21st.md`. Regras de uso:

- Buscar cada componente **pelo nome exato** listado no documento (via MCP/CLI do 21st Labs, se configurado, ou manualmente em 21st.dev) — não usar links fixos, que podem mudar de versão.
- A tag "Apple" do 21st.dev é fraca para telas completas de app — não se limitar a ela; os componentes certos vêm de buscas mais específicas (fitness, glassmorphism, progress-ring, onboarding), já resolvidas no documento.
- Não usar componentes de "Dock" (Ali Imam, Ruixen) para a tab bar principal — é a metáfora do macOS, não do iOS. Usar "Bottom menu" (YS).

## 7. Schema de dados

O schema-alvo do v1 tem 12 tabelas Supabase (`profiles`, `exercises`, `workout_plans`, `workout_plan_exercises`, `workout_schedule`, `workout_sessions`, `set_logs`, `meals`, `measurements`, `progress_photos`, `trail_days`, `push_subscriptions`) + 2 views. RLS habilitado em tudo, política `user_id = auth.uid()`. A extensão da Fase 8 também adiciona `profiles.reminder_times` e o agendamento seguro da Edge Function via Vault. O bloco do fim de `docs/schema.sql` foi aplicado ao projeto remoto em 29/08/2026; cron e Edge Function retornaram HTTP 200 na validação pós-deploy.

**Regra de avanço da trilha (fechada):**
- `workout_completed` = existe `workout_sessions` do dia com `status = 'completed'`
- `diet_completed` = pelo menos 3 refeições registradas no dia E soma de calorias entre 90–110% da meta diária (`profiles.daily_calorie_goal`) — calculado pela view `v_daily_nutrition_status`

SQL completo em `docs/schema.sql`. O projeto Supabase já existe; antes de aplicar blocos novos, revisar placeholders e nunca versionar chaves reais.

## 8. Roadmap de fases

**A orquestração completa e detalhada de execução (10 fases, Fase 0 a Fase 9, cada uma com dependências, checklist de entregáveis, critérios de aceite e um prompt pronto para o agente) está em `ORQUESTRACAO.md`, na raiz do projeto. Esse é o documento operacional — siga-o fase por fase, marcando os checkboxes conforme avança, para manter o progresso rastreável entre sessões.**

Visão resumida (não usar para execução, só para orientação rápida):

| Fase | Entregável |
|---|---|
| Fase 0 | Fundação técnica: scaffold React + Vite + PWA, tokens de design aplicados na config |
| Fase 1 | Supabase (schema, client, auth Google) — bloqueada até o usuário criar o projeto e preencher `.env.local` |
| Fase 2 | Design system aplicado e componentes base (21st.dev remapeado, tab bar) |
| Fase 3 | Elemento-assinatura: trilha de progresso (Home) |
| Fase 4 | Módulo Treinos |
| Fase 5 | Módulo Dieta |
| Fase 6 | Dashboard |
| Fase 7 | Medidas e progresso |
| Fase 8 | Finalização do PWA e notificações push |
| Fase 9 | QA final |

Fora de escopo do v1 (não implementar sem pedido explícito novo): reconhecimento de alimento por foto, Apple Sign-In, Apple Watch.

## 9. Pendências conhecidas (não inventar, perguntar)

Estes itens **não foram fechados** ainda — se o trabalho exigir uma decisão sobre eles, parar e perguntar ao usuário em vez de assumir:

- Copy deck completo (textos de onboarding, estados vazios, mensagens de erro) — só há proibições e tom definidos, não o texto final
- Protótipo/wireframe navegável — não construído
- Assets de marca (ícone do app, splash screen, favicon) — não gerados
- Critérios de aceite formais por tela — não definidos

## 10. Estilo de trabalho esperado do usuário

Comunicação formal, direta, em português. Rigor técnico sem arredondamento intermediário em cálculos. Ser crítico de forma proativa — sinalizar riscos, reversões de decisão ou inconsistências mesmo sem ser perguntado, e indicar claramente qual caminho é tecnicamente recomendado antes de executar.
