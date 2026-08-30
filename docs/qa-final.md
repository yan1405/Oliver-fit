# Oliver Fit — QA final do v1

**Início:** 30/08/2026  
**Estado:** em andamento — validações locais e inspeção autenticada concluídas; hardware real pendente.

## Critérios de aceite por tela

| Tela | Critérios derivados das Fases 1–8 | Estado em 30/08/2026 |
|---|---|---|
| Login | Google OAuth inicia corretamente; erro tem feedback; rota protegida redireciona sem sessão | Aprovado — Google OAuth ponta a ponta, redirecionamento, renderização mobile, acessibilidade e console. |
| Onboarding | Carrega e grava altura, peso e metas em `profiles`; campos numéricos válidos; aviso de push no iOS visível | Aprovado — carregou os valores reais do perfil e o aviso do iOS; formulário responsivo e sem overflow. Nenhum valor foi alterado na QA. |
| Home / Trilha | Dados reais de `trail_days`, `v_current_streak`, treino, refeições e perfil; trilha serpenteada; estados bloqueado/hoje/concluído; resumo diário coerente | Aprovado — resumo e trilha carregaram dados reais; os sete nós renderizaram e o último limpa a tab bar. |
| Treino | CRUD de exercícios; planos e agenda; execução com séries/carga; descanso; conclusão atualiza trilha; histórico de carga | Aprovado — Hoje, Planos, Exercícios e edição de registro existente foram inspecionados; lógica aprovada por teste. Nenhum registro foi salvo ou excluído na QA. |
| Dieta | CRUD de refeições; totais e macros sem arredondamento intermediário; regra de 3+ refeições e 90–110%; metas editáveis | Aprovado — metas e totais reais carregaram; seções e formulário foram inspecionados; lógica nutricional aprovada por teste. Nenhuma refeição foi criada. |
| Progresso | CRUD de medidas; gráfico real; upload, galeria, exclusão e comparação de fotos | Aprovado — abas Medidas/Fotos e os dois formulários passaram na inspeção responsiva; lógica aprovada por teste. Nenhuma medida ou foto foi criada. |
| Perfil | Metas editáveis; ativação/desativação e teste de push; horários válidos/ordenados; saída com confirmação | Aprovado visualmente — valores reais, metas e controles de push renderizaram sem overflow. Ativação/notificação continua pendente do teste em hardware. |

## Revisão de design em todas as telas

Aplicação estática e visual autenticada da skill `oliver-fit-design-review` sobre Login, Onboarding, Home, Treino, Dieta, Progresso e Perfil:

1. **Cor:** aprovado — nenhuma classe `indigo-*`, `zinc-*` ou `slate-*`; cores vêm dos tokens.
2. **Contraste:** corrigido — a escala tipográfica customizada era removida pelo `tailwind-merge`. Ações primárias agora preservam 20 px/700; o seletor de arquivo usa superfície neutra. Lighthouse de produção: contraste aprovado e acessibilidade 100.
3. **Ícones:** aprovado — SVGs locais curados; nenhum pacote genérico de ícones foi importado.
4. **Tipografia:** corrigido — `font: inherit` não sobrescreve mais tamanho/peso; `tailwind-merge` conhece toda a escala do Oliver Fit.
5. **Forma:** aprovado no código — raios `small`, `medium`, `large` e `pill` vêm dos tokens.
6. **Copy:** sem frases proibidas. Copy final de Login, Onboarding e Home continua marcada como pendência de produto nos próprios arquivos.
7. **Elementos-assinatura:** aprovado no código — trilha serpenteada com três estados; anel com espessura própria e microanimação de conclusão, respeitando movimento reduzido.
8. **Densidade e hierarquia:** aprovado em todas as telas no viewport mobile de 390×844. A navegação agora volta ao topo em cada rota e os formulários multicoluna não geram overflow horizontal.
9. **Stack sem default:** aprovado — componentes base usam tokens; nenhuma aparência padrão shadcn/Tailwind proibida foi encontrada.

## Validações executadas

- Testes: `trail`, `workouts`, `nutrition`, `dashboard`, `measurements`, `push` e `ui` aprovados.
- Build de produção aprovado; 15 entradas no precache e `sw.js` gerado.
- Navegação autenticada completa sem erros ou warnings no console.
- Corrigido o scroll preservado entre rotas; validação real: Home em `scrollY = 653`, Treino abriu em `scrollY = 0`.
- Corrigido o overflow do `Input` em grids: formulário de refeição passou de 462 px internos para 327 px, igual à largura disponível.
- Warning remanescente: `inlineDynamicImports` é emitido internamente pelo `vite-plugin-pwa@1.3.0`; não vem da configuração do app e não altera o artefato gerado.
- Lint não executou neste Windows porque a política de Controle de Aplicativo bloqueou o binário nativo do `oxlint`. TypeScript e build passaram.
- Manifest responde HTTP 200, declara `standalone`, escopo `/`, ícones 192×192 e 512×512; `sw.js` responde HTTP 200.
- Lighthouse sobre a build de produção, rota `/login`: Performance 97, Acessibilidade 100, Boas práticas 100; FCP 1,8 s, LCP 2,0 s, TBT 120 ms, CLS 0.

O arquivo bruto da medição está em `lighthouse-fase-9.json`.

## Pendências para fechar a Fase 9

1. Instalar e usar a PWA em pelo menos um dispositivo físico iOS ou Android, inclusive a notificação de teste.
2. Substituir o placeholder “OF” quando os assets finais de marca forem fornecidos.
3. Revisar e aprovar o copy final marcado com `TODO(copy)`.
