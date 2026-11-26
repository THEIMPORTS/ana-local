# Ana Local — a Ana da ANATECH MG no seu computador

Roda no seu PC, com a **sua chave da OpenAI**, sem Base44 no meio. Conversa no terminal e no WhatsApp.

## O que vem junto
- `identidade/IDENTITY.md` — quem é a Ana, a marca, as regras, os preços
- `regras/` — as regras permanentes que você já tinha
- `memoria/memorias.jsonl` — memórias iniciais (fatos do negócio) e tudo que ela aprender daqui pra frente
- `skills/` — as skills do laboratório, lidas sob demanda
- `projetos/` — pasta onde ela pode ler e escrever arquivos
- `src/` — o motor: conversa, ferramentas, memória, WhatsApp

## Instalação (2 passos)
1. Instale o Node.js 20 ou maior: https://nodejs.org
2. No terminal, dentro desta pasta:
```
bash instalar.sh
```
No Windows, clique com o botão direito em `instalar.ps1` e escolha **Executar com PowerShell**.

Depois abra o arquivo `.env` e preencha `OPENAI_API_KEY=sk-...`. Só isso.

## Usar
```
node src/index.js        # conversar no terminal
node src/whatsapp.js     # atender no WhatsApp
```

Comandos dentro do terminal: `/mem texto` guarda memória, `/memorias` lista, `/skills` lista as skills, `/gasto` mostra tokens usados, `/sair` encerra.

## WhatsApp
A ponte usa a Evolution API (gratuita, roda em Docker no seu PC):
```
docker run -d --name evolution -p 8080:8080 atendai/evolution-api:latest
```
1. Abra http://localhost:8080, crie a instância `ana` e leia o QR no seu WhatsApp
2. Copie a apikey para `EVOLUTION_KEY` no `.env`
3. Aponte o webhook da instância para `http://localhost:8787/webhook` (evento MESSAGES_UPSERT)
4. Rode `node src/whatsapp.js`

Sem Docker? Também funciona com a Evolution instalada direto (Node), ou com qualquer gateway que mande um POST com `data.message.conversation` e `data.key.remoteJid`.

## Custos
O gasto é por token, na sua conta da OpenAI. O comando `/gasto` mostra quantos tokens cada sessão consumiu, e o painel do WhatsApp expõe isso em `/saude`.

Para economizar:
- `ANA_MODEL` no modelo principal, `ANA_MODEL_BARATO` para tarefas simples
- O contexto já é enxuto: identidade, regras, 8 memórias relevantes e o índice de skills, sem despejar arquivo inteiro

## Segurança
- A chave fica só no seu `.env`, nunca em log
- `ANA_PERMITIR_COMANDO=nao` bloqueia execução de comandos
- `ZAP_PERMITIDOS` limita quem pode falar com ela
- A Ana só lê e escreve dentro de `projetos/`

## O que não vem
Ferramentas que dependem de serviço pago ou de canal específico: conectores OAuth (Google, Slack), publicação em redes sociais, workflows agendados do Base44 e as entidades do app. Essas viram scripts próprios ou automações locais, conforme a necessidade.

## Pacote completo (com as 185 skills)
O repositório traz o motor e a identidade. O pacote com todas as skills do laboratório está aqui:

https://base44.app/api/apps/69b1d5cd9842092aa391f94e/files/mp/public/69b1d5cd9842092aa391f94e/9cd8f590fdc8affb43d92c0dcaf676ea_ana-local-completo.zip

Baixe, extraia por cima da pasta e o índice de skills passa a mostrar as 185.

## Onde rodar
- **No seu PC**: melhor para trabalhar junto, com acesso aos seus arquivos.
- **Numa VPS**: melhor para o WhatsApp, porque fica no ar 24h mesmo com o PC desligado. A mesma receita funciona: instalar Node 20, rodar `instalar.sh`, preencher o `.env` e deixar o `whatsapp.js` rodando com `pm2` ou `systemd`.

## O que é diferente do Base44
Aqui você paga só o uso da OpenAI, não assinatura de plataforma. Em troca, você é o dono da máquina: atualiza, faz backup e responde por ela. Os conectores prontos do Base44 (Google, Slack, redes sociais) não vêm: viram scripts locais conforme a necessidade.


## Instalar tudo de uma vez (recomendado)

Na VPS Ubuntu, dentro da pasta:

    sudo bash deploy/instalar-tudo.sh 5531989513698

Em sequencia ele instala a Ana (motor, memoria, painel em 8788), o WhatsApp pela Evolution API (com QR salvo em /opt/ana/deploy/qr.png) e o Paperclip (em 3100). Cada etapa e idempotente: se uma falhar, rode de novo e ele retoma.

Antes de instalar de verdade, de para conferir a maquina sem mexer em nada:

    bash deploy/instalar-tudo.sh 5531989513698 --seco

Para pular o Paperclip: `--sem-paperclip`.

## Rodar 24 horas na VPS (serviço que reinicia sozinho)

Na VPS Ubuntu, dentro da pasta do projeto:

    sudo bash deploy/instalar-vps.sh

Ele instala o Node 20, cria o usuário de serviço, copia tudo para /opt/ana, registra dois serviços systemd e já sobe:

    ana-whatsapp  -> atende no WhatsApp e reinicia sozinho se cair
    ana-painel    -> painel de custo em http://IP-DA-VPS:8788

Comandos do dia a dia:

    sudo systemctl status ana-whatsapp
    sudo journalctl -u ana-whatsapp -f
    sudo systemctl restart ana-whatsapp

## Painel de custo

Rode `node src/painel.js` (ou o serviço acima) e abra http://localhost:8788. Mostra gasto de hoje, do mês e do total, tokens de entrada e saída, e o detalhe por modelo e por dia. O valor em reais aparece quando você preenche PRECO_ENTRADA e PRECO_SAIDA no .env com o preço por 1 milhão de tokens da sua conta. Sem isso, ele conta tokens e deixa o custo em zero.

## WhatsApp em um comando (Evolution API inclusa)

Na VPS, depois do instalar-vps.sh:

    sudo bash deploy/subir-whatsapp.sh 5531989513698

Ele instala o Docker se faltar, gera senhas, sobe Postgres, Redis e Evolution API (v2.1.1), espera a API responder, cria a instância "ana", aponta o webhook para http://host.docker.internal:8787/webhook (evento MESSAGES_UPSERT), grava a chave no /opt/ana/.env, reinicia o serviço da Ana e salva o QR Code em deploy/qr.png para você escanear em Aparelhos conectados.

Portas: a Evolution escuta só em 127.0.0.1:8080, nada exposto na internet. O webhook fala com a Ana pelo host, via host.docker.internal.

## Paperclip: o time de agentes (opcional)

O Paperclip e o orquestrador open source (MIT) que gerencia varios agentes como funcionarios: papel, metas, orcamento por agente e custo.

    sudo bash deploy/subir-paperclip.sh

Ele instala o Node 24, roda o onboarding, registra o servico e libera a porta 3100. A interface abre em http://IP-DA-VPS:3100, onde voce cria a empresa ANATECH MG e contrata a Ana como agente usando o adapter Codex com a mesma chave da OpenAI.

Depois de subir, coloque no .env da Ana:

    PAPERCLIP_URL=http://127.0.0.1:3100

E o painel em 8788 passa a mostrar o status do Paperclip junto com o gasto.

## Estrutura de oito sistemas (o MAPA)

A pasta `estrutura/` traz o desenho operacional da ANATECH MG: oito sistemas, os funcionarios de IA de cada um, o passo a passo escrito e as regras que nao se quebram.

    estrutura/MAPA.md                  visao geral e o que ja existe hoje
    estrutura/sistemas/01..08-*.md     um arquivo por sistema
    estrutura/segundo-cerebro.md       as tres camadas de memoria
    estrutura/rotinas.md               horarios e o que o dono recebe

Rotinas prontas para rodar:

    node src/rotinas.js briefing    # o que andou, travou e espera decisao
    node src/rotinas.js caixa       # confere caixa contra vendas
    node src/rotinas.js editorial   # pauta da semana

Cada rotina le `estado/<sistema>.json`. Sem arquivo, ela diz "sem registro" em vez de inventar numero. Exemplos em `estado/exemplos/`.

## Sistemas rodando com dado real

`estado/*.json` foi preenchido com os dados reais das entidades (3 clientes, 4 vendas, 10 pedidos de rifa pagos, 59 posts).
O briefing ja detectou uma divergencia real: a entidade Venda registra R$ 19,90 enquanto os PedidoRifa somam R$ 69,80.

## Agente de trafego pago

    node src/ads.js plano --produto "Pacote IA" --orcamento 40 --cpa 60
    node src/ads.js analisar --csv estado/ads/exemplo-google.csv --plataforma google --cpa 60
    node src/ads.js credenciais

O plano sai em markdown e CSV pronto para subir. A analise aplica as regras (pausar quem gastou 1 CPA sem converter,
escalar quem esta abaixo de 70% do alvo) e separa o que pode fazer sozinho do que espera aprovacao.
Passo a passo completo do funcionario em estrutura/agentes/trafego-ads.md.
