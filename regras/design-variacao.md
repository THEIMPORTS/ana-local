---
name: design-variacao
description: Regra dura contra páginas iguais. Toda landing ou site novo escolhe uma macroestrutura e um tema diferentes dos dois últimos builds, registra a escolha no log e nunca usa o esqueleto padrão (hero centralizado + cards escuros + laranja).
---

# Direção de design: variação obrigatória

O dono reclamou em 29/10/2026: "não tá ficando profissional, tá ficando tudo a mesma coisa". A causa era sempre o mesmo esqueleto: fundo escuro, hero centralizado, grade de cards, botão laranja. Isso é template, não design.

## Regra
1. Antes de escrever qualquer página, escolher UMA macroestrutura (Hallmark, 21 disponíveis) e UM tema, e declarar a escolha na primeira linha do CSS.
2. A escolha não pode repetir nenhuma das DUAS últimas usadas (ver log no fim deste arquivo).
3. Proibido por padrão: hero centralizado com parágrafo e um botão, grade de cards iguais, três cards de preço idênticos, ícone emoji no lugar de ícone desenhado, seção de depoimento sem depoimento real.
4. Cada página precisa de uma ideia estrutural própria, ditada pelo produto: número que abre a página, documento corrido, dupla coluna com prova real, diagrama, índice, catálogo, cronologia.
5. Nada de imagem inventada: usar captura real do produto, foto real do dono, ou tipografia forte.
6. Rodar o lint de design antes de publicar.

## Macroestruturas que já usamos (não repetir em sequência)
- quantbot.html: Stat-Led escuro (29/10)
- rifa-servico.html: Split editorial claro (29/10)

## Próximas direções planejadas
- pacote-ia.html: Workbench (capturas reais do agente rodando)
- vitrine/marketplace: Catálogo com índice lateral
- cursos: Índice primeiro, sem hero de marketing
- SIP: Documento longo, leitura corrida
