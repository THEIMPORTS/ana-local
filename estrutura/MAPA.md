---
title: MAPA — os oito sistemas da ANATECH MG
summary: Estrutura operacional com oito sistemas, funcionários de IA em cada um e um segundo cérebro compartilhado.
---

# MAPA — os oito sistemas da ANATECH MG

A ideia é simples: a empresa funciona em oito sistemas. Em cada um trabalham funcionários de IA com o passo a passo escrito. Todos leem e escrevem no mesmo segundo cérebro. O dono aparece no fim, aprovando.

## Os oito sistemas

| # | Sistema | Para que serve |
|---|---|---|
| 01 | CRM e Vendas | Onde o dinheiro nasce: contato, conversa, proposta, fechamento. |
| 02 | Conteúdo e Editorial | Produção e distribuição que alimenta o funil todos os dias. |
| 03 | Tráfego e Aquisição | Quem vê, quem clica, quanto custa. |
| 04 | Atendimento | A porta de entrada, 24 horas. |
| 05 | Financeiro e Caixa | Todo dia às nove, o caixa é conferido. |
| 06 | Operação e Entrega | O que foi vendido tem que ser entregue. |
| 07 | Produto e Engenharia | Fábrica de Software: um app por mês, demanda validada antes. |
| 08 | Inteligência e Memória | O segundo cérebro: o que a empresa sabe e o que precisa decidir. |

## O que já existe hoje na ANATECH MG

1. CRM e Vendas: entidade Cliente e Venda no Base44, atendimento da Ana no WhatsApp
2. Conteúdo e Editorial: 13 posts publicados e 24 agendados
3. Tráfego: pixel de recebimento da rifa e do checkout de cursos
4. Atendimento: Ana por texto e por áudio, com catálogo oficial de preços
5. Financeiro: conferência manual, PIX estático no checkout
6. Operação: 1.068 cursos com PDF, certificados com validação, rifa com números
7. Produto: portal de cursos, landing da COPY-X, Grupos, app da rifa
8. Inteligência: memórias da Ana, briefing matinal que já roda às 8h

## O que falta para virar estrutura de verdade

1. Cada sistema com seu arquivo de estado, não com dados espalhados
2. Rotina fixa: caixa às 9h, editorial na segunda, briefing todo dia útil
3. Funcionário só faz o que está escrito no passo a passo dele
4. Toda saída cai no segundo cérebro, com data e origem
5. Decisão que exige dinheiro ou exposição pública espera o dono

## Como rodar

    node src/rotinas.js briefing    # resumo do dia
    node src/rotinas.js caixa       # conferência do caixa
    node src/rotinas.js editorial   # pauta da semana

Ver também: [[segundo-cerebro]] e [[rotinas]].
