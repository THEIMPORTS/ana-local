---
title: Segundo cérebro da ANATECH MG
summary: Onde a empresa guarda o que sabe: memórias, estado por sistema e regras que valem sempre.
---

# Segundo cérebro

Não é um chat com histórico. É uma pasta com três camadas:

1. *Memórias* — fatos duráveis do negócio (preços, marca, decisões). Ficam em `memoria/memorias.jsonl`, com categoria e data
2. *Estado* — o que está acontecendo agora, um arquivo por sistema em `estado/`. Exemplo: `estado/caixa.json`, `estado/crm.json`
3. *Regras* — o que não se discute, em `regras/*.md`, lido em toda conversa

## Regra de ouro

Fato verificado, fato dito e palpite ficam separados. A Ana só afirma como verdadeiro o que está registrado como verificado.

## Como a memória é consultada

Antes de responder qualquer pergunta sobre a empresa, a Ana lê as memórias por palavra-chave e o estado do sistema envolvido. Se não achou, diz que não achou.
