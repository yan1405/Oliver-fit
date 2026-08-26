# Oliver Fit — Auditoria "design sem cara de IA"

**Data:** 18 de agosto de 2026
**Escopo:** tokens de design (`oliver_fit_design_tokens.json`) e seleção de componentes (`Oliver_Fit_Componentes_21st_dev.md`). Ainda não há código — o script `auditar_tells_ia.py` não se aplica agora; deve rodar de novo dentro do Claude Code assim que houver HTML/JSX real, antes de qualquer entrega.

## Veredito geral

O projeto está **ancorado corretamente** (fase 2 da skill) — "Apple, iOS 16+, Ajustes/Saúde" é uma referência nomeada e específica, não "moderno e limpo". Isso já evita a maior parte da média genérica de SaaS. Mas a ancoragem tem um efeito colateral que precisa de correção: **estamos tão fiéis à Apple que o app corre o risco de não ter identidade própria nenhuma** — hoje, tirando o nome "Oliver Fit", nada na interface diria que o app é seu e não um clone de tela do Ajustes ou do Apple Fitness. Isso é o oposto do "AI slop" (que é genérico por falta de decisão), mas chega a um problema parecido por outro caminho: falta um elemento-assinatura que seja *do Oliver Fit*, não *da Apple*.

## Checklist, ponto a ponto

| Item | Veredito | Nota |
|---|---|---|
| Paleta com propósito semântico, sem gradiente roxo-índigo não justificado | ✅ Passa | Azul `#007AFF` é o sistema Apple, usado só em ação principal — mas é literalmente a cor de qualquer app "estilo Apple" gerado por IA hoje. Não é um tell de genérico (está ancorado), mas também não diferencia o Oliver Fit de nenhum outro app com a mesma referência. |
| Tipografia com decisão de personalidade, não Inter por omissão | ✅ Passa, com risco técnico | `-apple-system`/SF Pro é uma escolha deliberada e correta para "parecer Apple" — mas fora de dispositivo Apple (Android) cai no fallback do sistema (Roboto), quebrando a identidade exatamente onde ela mais falta. Já registrado como nota crítica no arquivo de tokens. |
| Decisão visual forte e única por tela | ⚠️ Risco | O Apple Activity Ring é reaproveitado em quase toda tela (trilha, dashboard, dieta) — é bonito, mas é um componente importado 1:1 do Apple Fitness, não uma decisão sua. A trilha estilo Duolingo é a peça com maior potencial de ser o elemento-assinatura real do app, mas nunca defini a forma visual exata dela (ver decisão em aberto abaixo). |
| Grid com hierarquia real, não tudo centralizado com o mesmo padding | ⚠️ Risco | Escolhemos densidade "confortável" igual para o app inteiro. É exatamente o padrão que a skill aponta como tell (espaço generoso demais em vez de hierarquia real). Recomendo tratar isso na hora de montar cada tela: variar o ritmo entre telas densas (histórico de treino) e telas de destaque (dashboard, trilha), em vez de aplicar a mesma régua em tudo. |
| Ícones/imagens específicos, não kit genérico sem curadoria | ⚠️ Risco a monitorar | SF Symbols é a escolha certa, mas como não tem exportação web oficial, o risco real é o Claude Code "resolver fácil" trocando por Lucide puro sem curadoria — isso É literalmente o tell #4 da skill. Precisa virar regra explícita no CLAUDE.md. |
| Movimento comunica estado, não decorativo | ✅ Passa | Já documentado nos tokens: "sempre com propósito de feedback, nunca decorativo". |
| Copy testa "o fundador diria isso em voz alta" | ❌ Ainda não existe | Copy deck é uma lacuna conhecida (já registrada). Risco real: se o Claude Code escrever texto de onboarding/CTA sem direção, cai direto nas frases proibidas pela skill ("leve seu treino para o próximo nível"). Precisa de lista de proibições explícita antes de gerar qualquer texto. |
| Contraste ≥ 4.5:1 em qualquer superfície de vidro, nos dois temas | ❌ Não verificado | Este é o achado mais crítico da auditoria. Escolhemos glassmorphism (blur 20%, 70-80% opacidade) para navegação e cards de destaque — é exatamente a combinação que a skill aponta como tell de acessibilidade (vidro fosco cobrindo texto). Nenhum contraste foi calculado ainda. |
| Stack sem sobrescrever nada (Tailwind/shadcn padrão) | ⚠️ Risco a monitorar | Os componentes vêm do 21st.dev (shadcn/Tailwind), que é o stack padrão de qualquer ferramenta de geração — não é problema por si, mas só continua não sendo problema se o Claude Code de fato aplicar os tokens do Oliver Fit por cima, e não os defaults de cor do shadcn (zinc/slate) ou do Tailwind (indigo). |

## Correções que já aplico agora (fechadas, sem precisar de nova decisão sua)

1. **Regra de contraste obrigatória** — qualquer texto sobre superfície de vidro precisa manter contraste ≥ 4.5:1 nos dois temas, inclusive com conteúdo em movimento atrás. Onde o contraste não for garantido, usar uma camada sólida semi-opaca por trás do texto (é o que a própria Apple faz — "vibrancy" nunca é vidro puro sob texto de corpo).
2. **Proibição explícita de fallback silencioso para Lucide genérico** — se o SF Symbols recriado não estiver disponível para um ícone específico, a substituição precisa ser curada (mesmo peso de traço, mesmo grid), nunca "importar o pacote inteiro do Lucide e usar direto".
3. **Lista de proibições de copy** — nenhuma variação de "leve [x] para o próximo nível", "tudo em um só lugar", "construa o seu melhor eu" nos textos do app. Tom definido: direto e encorajador, testado pela pergunta "eu diria isso em voz alta pro Oliver Fit?".
4. **Proibição de defaults do shadcn/Tailwind** — nenhuma cor `indigo-*`, `zinc-*` ou `slate-*` padrão do Tailwind pode sobreviver sem ser substituída pelos tokens do Oliver Fit.

Essas quatro regras entram no CLAUDE.md como restrições explícitas (é a alavanca #2 da skill: proibir em voz alta funciona melhor que direção positiva solta).

## Decisões em aberto (precisam da sua palavra)

1. **Forma visual da trilha** — hoje só decidimos a regra de avanço (treino + dieta), não a forma. Isso é o candidato mais forte a elemento-assinatura do Oliver Fit e merece uma decisão deliberada, não o que o Claude Code achar mais fácil de gerar.
2. **Apple Activity Ring — usar como está ou dar uma torção própria?** Hoje é reaproveitado literalmente do Apple Fitness em três telas. Podemos manter (reforça "parece Apple de verdade") ou ajustar sutilmente (ex.: espessura, comportamento ao completar) para que fique reconhecível como "o anel do Oliver Fit", não um recorte do Fitness.
