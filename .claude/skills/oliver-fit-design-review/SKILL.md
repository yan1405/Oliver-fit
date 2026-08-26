---
name: oliver-fit-design-review
description: Audita telas, componentes ou trechos de UI do Oliver Fit contra os tokens de design (docs/design-tokens.json) e as regras anti-cara-de-IA fechadas no projeto. Use sempre que uma tela ou componente novo do Oliver Fit for criado, revisado, ou antes de considerá-lo pronto.
---

# Revisão de design — Oliver Fit

Este projeto tem um design system fechado e uma auditoria anti-"cara de IA" já feita (`docs/design-tokens.json`, `docs/auditoria-design.md`, `CLAUDE.md`). Esta skill aplica essas regras de forma consistente a cada tela/componente novo, em vez de reavaliar a decisão do zero toda vez.

## Quando rodar

Sempre que uma tela, componente ou trecho de UI do Oliver Fit for criado ou alterado — antes de considerar o trabalho pronto para revisão do usuário.

## Checklist obrigatório

1. **Cor** — nenhuma cor fora dos tokens em `docs/design-tokens.json` (`design_system.color`). Zero classes `indigo-*`, `zinc-*` ou `slate-*` do Tailwind/shadcn sobrevivendo sem remapeamento explícito para os tokens do Oliver Fit.
2. **Contraste** — todo texto sobre superfície de vidro (glassmorphism) precisa manter contraste ≥ 4.5:1, nos dois temas (claro/escuro), inclusive com conteúdo em movimento atrás. Se não for garantido, exigir uma camada sólida semi-opaca por trás do texto antes do blur.
3. **Ícones** — vindos de SF Symbols recriado como SVG, ou de um set alternativo (ex.: Lucide) curado individualmente no mesmo peso de traço. Nunca importar o pacote de ícones inteiro como substituto silencioso e sem curadoria.
4. **Tipografia** — só a escala definida em `design_system.typography.type_scale` dos tokens. Família `-apple-system`/SF Pro, nunca uma fonte não declarada nos tokens.
5. **Forma** — raio de borda vindo de `design_system.shape.border_radius` (cantos grandes, squircle ~20px em cards, conforme os tokens).
6. **Copy** — nenhuma frase da lista `design_style.brand_voice_in_ui.forbidden_phrases` dos tokens. Toda manchete, CTA ou texto de destaque precisa passar no teste: "eu diria isso em voz alta pro Oliver Fit?".
7. **Elementos-assinatura** — se a tela envolver a trilha de progresso ou o anel de atividade, confirmar que seguem exatamente `signature_elements` dos tokens: trilha em caminho serpenteado vertical (não linha reta, não mapa); anel de atividade com identidade própria (espessura/micro-comportamento ajustados), não idêntico ao Apple Fitness.
8. **Densidade e hierarquia** — a tela não pode ter tudo no mesmo espaçamento e peso visual; precisa de uma decisão visual clara e única (ver critério completo em `docs/auditoria-design.md`).
9. **Stack sem default** — componentes vindos do 21st.dev (base shadcn/Tailwind) precisam ter cor e raio remapeados para os tokens do Oliver Fit antes de a tela ser considerada pronta — usar o componente "como veio" não é aceitável.

## Ao final

Reporte, item a item do checklist, o que passou e o que precisa de ajuste — nunca aprove em silêncio. Se algo pedido na tarefa conflitar com uma regra deste checklist, avise o usuário antes de decidir sozinho qual das duas prevalece.
