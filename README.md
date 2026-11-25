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
