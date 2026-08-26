# Oliver Fit — Plano de Projeto

**Autor:** Yan Guilherme Oliveira da Silva
**Data:** 17 de agosto de 2026
**Repositório:** [github.com/yan1405/Oliver-fit](https://github.com/yan1405/Oliver-fit) (vazio, aguardando implementação)
**Ambiente de construção:** Google Antigravity (agentes nativos) — este documento é o briefing de entrada para essa etapa; nenhuma linha de código foi executada nesta sessão.
**Uso:** Aplicativo pessoal, uso individual, sem previsão de multiusuário no v1.

---

## 1. Resumo da decisão

Depois de três rodadas de perguntas, o escopo do Oliver Fit está definido como um **PWA (Progressive Web App)** de acompanhamento de treinos e dieta, com identidade visual Apple, trilha de progresso estilo Duolingo como tela inicial, dados sincronizados em nuvem pessoal gratuita e login único via Google. A tabela abaixo consolida cada decisão e o porquê dela.

| Tema | Decisão | Justificativa |
|---|---|---|
| Plataforma de instalação | PWA (web instalável) | Único caminho que cobre iPhone e Android simultaneamente sem custo. App nativo real na App Store exigiria conta Apple Developer paga (US\$ 99/ano), o que contraria a meta de custo zero. |
| Hospedagem/backend | Nuvem pessoal gratuita (Supabase, recomendado) — **não** o tenant Azure da Crescitech | Ver seção 6 — risco de mistura de dados pessoais de saúde com ambiente corporativo e de uso de credencial de admin global para um app hobby. |
| Autenticação | Google Sign-In apenas | Sign in with Apple exige Apple Developer Program pago; login social único simplifica o app sem custo. |
| Estrutura da Home | Trilha de progresso (estilo Duolingo) | Avança um "dia" na trilha somente quando treino **e** dieta do dia estão concluídos — reforça os dois hábitos juntos. |
| Biblioteca de exercícios | Cadastro próprio | Você cadastra apenas os exercícios que realmente treina; sem base pública genérica. |
| Reconhecimento de alimento por foto (estilo CalAI) | Fora de escopo — CalAI é referência apenas visual | Confirmado por você: a menção ao CalAI era sobre o *design* do app, não sobre replicar a funcionalidade de IA de visão computacional. |
| Notificações | Push habilitado desde o v1, com aviso de limitação no iOS | PWA no iPhone só recebe push se instalado via "Adicionar à Tela de Início" e com iOS 16.4+; o app deve orientar isso no onboarding. |
| Cor de destaque | Azul padrão Apple (Action Blue) | Modo claro/escuro automático, seguindo a configuração do sistema. |

---

## 2. Referências de design

- **21st.dev** — marketplace de componentes React/Tailwind baseados em shadcn/ui, com uma coleção dedicada de [40+ componentes estilo Apple](https://21st.dev/community/components/s/apple) (botões, cards, tab bars, sliders, etc.), além de uma [coleção "iphone"](https://21st.dev/community/components/s/iphone) com mockups de tela. Serão a base de componentes reaproveitáveis para o Antigravity montar as telas.
- **Apple Human Interface Guidelines (HIG)** — referência oficial para espaçamento (grid de 8pt), tipografia (fonte do sistema `-apple-system`, que renderiza como SF Pro nativamente em dispositivos Apple sem custo de licença), hierarquia de "large titles", e padrão de navegação por tab bar inferior.
- **Apple Fitness+** — inspiração geral de energia visual (cards grandes, uso de cor para métricas).
- **CalAI** — inspiração **visual** para o módulo de dieta: interface centrada em cards de refeição, tipografia grande para números (calorias/macros), anéis de progresso de macronutrientes. Nenhuma funcionalidade de reconhecimento de imagem será replicada no v1.

---

## 3. Arquitetura técnica recomendada

```
Frontend:  React + Vite + TypeScript + Tailwind CSS
           Componentes base adaptados do registro 21st.dev (compatível com shadcn/ui)
           PWA: manifest.json + service worker (vite-plugin-pwa ou Workbox)
           Web Push API para notificações

Backend:   Supabase
           - Postgres (dados de treino, dieta, medidas, trilha)
           - Auth (Google OAuth)
           - Storage (fotos de progresso)
           - Row Level Security (RLS) — mesmo sendo uso individual, protege os dados
             caso o projeto seja publicado ou expandido no futuro

Hospedagem: Vercel (camada gratuita) ou Netlify — build estático do PWA
```

**Por que Supabase em vez de Firebase:** ambos têm camada gratuita adequada a um único usuário. Supabase foi priorizado por usar Postgres (SQL relacional, mais natural para o modelo de dados de treino/dieta com relações entre tabelas) e por já embutir autenticação e storage de arquivos no mesmo projeto gratuito, reduzindo o número de serviços a configurar. Firebase (Firestore) é uma alternativa igualmente válida, caso o Antigravity tenha melhor suporte nativo a ela — essa é uma decisão técnica reversível, sem impacto na experiência final do app.

---

## 4. Módulos do v1

### 4.1 Trilha de Progresso (tela inicial)
Caminho visual (nós conectados, como uma trilha de mapa) em que cada nó representa um dia. Um dia é marcado como concluído — e a trilha avança — apenas quando **treino do dia** e **registro de dieta do dia** estiverem ambos completos. Deve exibir sequência atual (streak) e destacar visualmente o dia de hoje.

### 4.2 Treinos
- Cadastro de exercícios próprios (nome, grupo muscular, opcional: instrução/observação).
- Montagem de planos de treino (dias da semana, exercícios, séries/repetições/carga alvo).
- Execução do treino do dia: log de séries realizadas, cronômetro de descanso entre séries.
- Histórico por exercício (evolução de carga ao longo do tempo).

### 4.3 Dieta / Nutrição
- Registro manual de refeições (nome do alimento, quantidade, calorias, macros).
- Metas diárias de calorias e macronutrientes (proteína, carboidrato, gordura).
- Visual inspirado no CalAI: cards de refeição e anéis de progresso de macro.

### 4.4 Medidas e Progresso
- Peso corporal ao longo do tempo (gráfico de evolução).
- Medidas corporais (braço, cintura, peito, etc. — campos configuráveis).
- Fotos de progresso, organizadas por data, com comparação lado a lado.

### 4.5 Dashboard
- Resumo do dia: status do treino, calorias restantes, streak da trilha — inspirado na tela inicial do Apple Saúde.

---

## 5. Fluxo de telas (arquitetura de informação)

1. **Onboarding** — login com Google, dados iniciais (peso, altura, metas).
2. **Home / Trilha de Progresso** — ponto de entrada padrão do app.
3. **Treino do dia** — a partir de um nó da trilha ou da tab bar.
4. **Biblioteca de treinos** — planos e cadastro de exercícios.
5. **Dieta do dia** — registro de refeições e macros.
6. **Progresso** — gráficos de peso/medidas e galeria de fotos.
7. **Perfil/Configurações** — metas, notificações, conta.

Navegação principal via **tab bar inferior** (padrão iOS), com a Trilha de Progresso como aba central/inicial.

---

## 6. Ponto crítico: uso do Azure da Crescitech

Você indicou ter uma conta de admin global no tenant Azure da Crescitech e ofereceu usá-la para o backend do Oliver Fit. Minha avaliação, e a que você confirmou seguir, é **não usar esse tenant** para este projeto, pelos seguintes motivos:

1. **Natureza dos dados** — o app armazena dados de saúde pessoal (peso, medidas corporais, hábitos alimentares e físicos). Hospedar isso no ambiente de uma consultoria de IA cria uma mistura de dados pessoais sensíveis com infraestrutura corporativa, sem necessidade.
2. **Governança de custos** — mesmo dentro de camadas gratuitas do Azure, o consumo fica associado à assinatura da empresa; qualquer pico de uso (ex.: storage de fotos, chamadas de API) é uma despesa que aparece no ambiente corporativo, não no seu nome.
3. **Princípio de menor privilégio** — usar uma conta de **admin global** para um app pessoal é desproporcional ao necessário; é uma prática de segurança a evitar mesmo quando o acesso é legítimo.

**Decisão final registrada:** backend em nuvem pessoal gratuita (Supabase), fora do tenant da Crescitech.

---

## 7. Roadmap de fases

| Fase | Entregável | Escopo |
|---|---|---|
| Fase 0 | Setup do projeto | Scaffold React + Vite + PWA no Antigravity, projeto Supabase, tokens de design Apple (cor, tipografia, espaçamento) |
| Fase 1 (MVP) | Treino + Trilha básica | Login Google, cadastro de exercícios, execução de treino, trilha avançando só por treino |
| Fase 2 | Dieta completa | Registro de refeições/macros, trilha combinada (treino + dieta), notificações push |
| Fase 3 | Progresso visual | Medidas corporais, fotos de progresso, gráficos de evolução, polimento visual (blur, animações estilo Apple) |
| Fase 4 (futuro, opcional) | Expansões | Reconhecimento de alimento por foto (se revisitado), Apple Sign-In (se decidir pagar a taxa), integração com Apple Watch |

---

## 8. Próximos passos sugeridos

1. Revisar este documento e sinalizar qualquer ajuste de escopo antes de levá-lo ao Antigravity.
2. No Antigravity: criar o repositório local a partir de `github.com/yan1405/Oliver-fit`, iniciar o scaffold da Fase 0.
3. Configurar o projeto Supabase (gratuito) e o provedor Google OAuth.
4. Buscar/adaptar os componentes Apple do 21st.dev como base de UI antes de estilizar telas do zero.

---

*Documento gerado como planejamento — nenhuma implementação foi iniciada nesta sessão, conforme solicitado.*
