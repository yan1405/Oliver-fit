# Oliver Fit — Seleção de Componentes 21st.dev

**Data:** 18 de agosto de 2026
**Base:** busca dirigida em 21st.dev nas coleções `apple`, `iphone`, `glassmorphism`, `ios`, `fitness`, `progress-ring`, `bottom-sheet`, `onboarding` e `line-chart`, cruzada com os tokens definidos no Design DNA.

## Ponto crítico antes da lista

A coleção com a tag **"Apple"** do 21st.dev (`/community/components/s/apple`) tem só 21 componentes, e a maioria é mockup de dispositivo (iPhone, Mac, Macbook) ou efeito pontual (Dynamic Island, Siri, Hello Effect, Emoji Picker) — **não é um UI kit de telas de app**. Usar só essa tag teria dado um resultado pobre. O que de fato serve para montar as telas do Oliver Fit está espalhado em categorias mais específicas (fitness, glassmorphism, progress-ring, onboarding), que foram as pesquisadas abaixo.

Também não existe, hoje, um componente pronto de **trilha estilo Duolingo** no catálogo — isso é uma peça que os agentes do Antigravity vão ter que construir do zero (ver seção 7).

---

## 1. Navegação (Tab Bar)

| Componente | Autor | Papel |
|---|---|---|
| **Bottom menu** | YS | Tab bar inferior — candidato direto para a navegação principal |
| Dock / Dock Tabs / DockMorph | Ali Imam / Ruixen | **Não recomendado** para a tab bar principal — é a metáfora do Dock do macOS (ícones flutuantes centralizados), diferente do padrão de tab bar do iOS. Guardar como alternativa só se quiser um seletor secundário estilo Dock. |

## 2. Onboarding / Login

| Componente | Autor | Papel |
|---|---|---|
| **Onboard Card** | Aman Shakya | Telas de apresentação inicial (1-2-3 antes do login) |
| **Onboarding Form** | Ravi Katiyar | Formulário de dados iniciais (peso, altura, metas) |
| **Native Button** | Moumen Soliman | Botão "Continuar com Google" com visual nativo iOS |

## 3. Home / Trilha de Progresso

| Componente | Autor | Papel |
|---|---|---|
| **Apple Activity Ring** | Kokonut Baffier | Anel de progresso do dia atual dentro do nó da trilha |
| Timelines (categoria, 74 itens) / **How It Works Timeline** (7ovr) / **Radial Orbital Timeline** | — | Estrutura de referência mais próxima de um "caminho" — precisa de adaptação manual, não é plug-and-play (ver seção 7) |

## 4. Dashboard

| Componente | Autor | Papel |
|---|---|---|
| **Health Stat Card** (2 variantes) | — | Cards de resumo (calorias restantes, treino do dia) |
| **Stats Card** | — | Métricas gerais |
| **Progress Metric Card** | MV | Indicador de progresso com número + barra/anel |
| **Apple Activity Ring** | Kokonut Baffier | Anéis de atividade no topo do dashboard |

## 5. Treinos

| Componente | Autor | Papel |
|---|---|---|
| **Workout Card** | — | Item de lista de plano de treino |
| **Workout Summary Card** | — | Resumo ao final do treino do dia |
| **Tracker Card** | — | Acompanhamento de série/carga |
| **Activity Card** | — | Card de atividade genérico, alternativa ao Workout Card |
| **Coach Scheduling Card** | — | Base para adaptar o agendamento semanal de treino |
| **BeUI Bottom Sheet** | — | Sheet inferior para "adicionar série" / selecionar exercício |

## 6. Dieta / Nutrição

| Componente | Autor | Papel |
|---|---|---|
| **Apple Activity Ring** | Kokonut Baffier | Anéis de macro (proteína/carbo/gordura) — visual mais próximo do pedido de referência CalAI |
| **Glass Card** / **Frosted Card** | Rushil Dhinoja / Ravi Katiyar | Card de refeição, com o efeito de vidro já definido nos tokens |
| **Health Stat Card** | — | Calorias e macros do dia |
| **BeUI Bottom Sheet** | — | Sheet para registrar refeição |

## 7. Medidas e Progresso

| Componente | Autor | Papel |
|---|---|---|
| **Line Chart** (Multi-line Chart) | Legion Dev | Gráfico de evolução de peso/medidas ao longo do tempo |
| **Glass Calendar** | Ravi Katiyar | Navegação por data no histórico de fotos/medidas |

## 8. Componentes transversais (usados em várias telas)

| Componente | Autor | Papel |
|---|---|---|
| **Glass Card / Frosted Card / Interactive Frosted Glass Card** | Rushil Dhinoja / Ravi Katiyar / Dhileep Kumar GM | Base de card com glass, para cards de destaque conforme os tokens |
| **Native Button** | Moumen Soliman | Botão padrão com visual iOS nativo |
| **Toggle Switch Glass** | Zachary BENSALEM | Toggles de configuração |
| **Apple Liquid glass switcher** | dennysdionigi | Alternativa de toggle com efeito de vidro mais acentuado |
| **iOS Spinner** | Yadwinder Singh | Indicador de carregamento |
| **BeUI Dynamic Island / Dynamic Island** | — / Erik / Edu Calvo | Status flutuante — candidato para o cronômetro de descanso durante o treino (fase 2, é um "extra" de identidade Apple, não essencial ao MVP) |

---

## Como levar isso ao Antigravity

O próprio grupo 21st Labs mantém um MCP/CLI (`magic-mcp`, `cli`, `skill`) feito exatamente para buscar, instalar e publicar esses componentes direto do terminal ou de um agente. A recomendação é configurar esse MCP dentro do Antigravity e instruir os agentes, via `.agents/rules/design-system.md`, a **buscar cada componente pelo nome exato listado acima** (não pelo link, que pode mudar) no momento de montar cada tela — isso garante que a versão mais atual do componente seja puxada, já adaptada ao projeto via CLI, em vez de copiar código desatualizado manualmente.

## O que não existe pronto (construir do zero)

A trilha de progresso estilo Duolingo não tem equivalente direto no catálogo. A peça mais próxima como ponto de partida estrutural é a categoria **Timelines** (74 componentes) — vale abrir essa categoria inteira no Antigravity e adaptar um layout de linha/caminho vertical ou serpenteante, combinando com o **Apple Activity Ring** em cada nó de dia. Isso deve entrar no roadmap como item de desenvolvimento customizado, não como "importar componente".
