#!/usr/bin/env bash
# Instala a Ana no seu computador (Linux, macOS ou WSL).
set -euo pipefail
cd "$(dirname "$0")"

echo "==> verificando Node"
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js não encontrado. Instale a versão 20 ou maior em https://nodejs.org e rode de novo."
  exit 1
fi
VERSAO=$(node -p "process.versions.node.split('.')[0]")
if [ "$VERSAO" -lt 20 ]; then
  echo "Seu Node é $VERSAO. Precisa ser 20 ou maior."
  exit 1
fi
echo "    Node $(node -v) ok"

echo "==> preparando pastas"
mkdir -p projetos memoria skills

if [ ! -f .env ]; then
  cp .env.example .env
  echo "    criei o arquivo .env"
else
  echo "    .env já existe, mantive o seu"
fi

echo "==> testando o núcleo (não gasta crédito)"
node src/teste.js

echo
echo "======================================================"
echo "Pronto. Falta um passo: coloque sua chave da OpenAI no .env"
echo
echo "  abra o arquivo .env e preencha: OPENAI_API_KEY=sk-..."
echo
echo "Depois é só rodar:"
echo "  node src/index.js      -> conversar no terminal"
echo "  node src/whatsapp.js   -> atender no WhatsApp"
echo "======================================================"
