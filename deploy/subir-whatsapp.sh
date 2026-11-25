#!/usr/bin/env bash
# Sobe a Evolution API (WhatsApp) e conecta na Ana.
# Uso: sudo bash deploy/subir-whatsapp.sh [numero-do-dono]
set -euo pipefail
cd "$(dirname "$0")"

NUMERO="${1:-5531989513698}"
PASTA_ANA="${PASTA_ANA:-/opt/ana}"
ZAP_PORTA="${ZAP_PORTA:-8787}"

echo "==> 1/6 verificando Docker"
if ! command -v docker >/dev/null 2>&1; then
  echo "    instalando Docker"
  curl -fsSL https://get.docker.com | sh
fi
docker compose version >/dev/null 2>&1 || { echo "Docker Compose v2 não encontrado. Atualize o Docker."; exit 1; }

echo "==> 2/6 gerando senhas"
if [ ! -f .env ]; then
  CHAVE=$(head -c 32 /dev/urandom | base64 | tr -dc 'A-Za-z0-9' | head -c 40)
  SENHA=$(head -c 24 /dev/urandom | base64 | tr -dc 'A-Za-z0-9' | head -c 24)
  cat > .env <<EOF
EVOLUTION_KEY=$CHAVE
POSTGRES_PASSWORD=$SENHA
EOF
  echo "    .env criado"
else
  echo "    .env já existe, mantive"
fi
set -a; . ./.env; set +a

echo "==> 3/6 subindo banco, cache e Evolution"
docker compose up -d

echo "    aguardando a API responder"
for i in $(seq 1 40); do
  if curl -fsS -m 3 -H "apikey: $EVOLUTION_KEY" http://127.0.0.1:8080/instance/fetchInstances >/dev/null 2>&1; then
    echo "    Evolution no ar"
    break
  fi
  sleep 3
  if [ "$i" = "40" ]; then
    echo "    a API não respondeu. Veja os logs: docker compose logs --tail=60 evolution"
    exit 1
  fi
done

echo "==> 4/6 criando a instância 'ana'"
EXISTE=$(curl -fsS -H "apikey: $EVOLUTION_KEY" http://127.0.0.1:8080/instance/fetchInstances \
  | python3 -c "import sys,json;d=json.load(sys.stdin);print('sim' if any((x.get('name')=='ana') for x in d) else 'nao')" 2>/dev/null || echo nao)
if [ "$EXISTE" = "nao" ]; then
  curl -fsS -X POST http://127.0.0.1:8080/instance/create \
    -H "apikey: $EVOLUTION_KEY" -H "Content-Type: application/json" \
    -d "{\"instanceName\":\"ana\",\"qrcode\":true,\"integration\":\"WHATSAPP-BAILEYS\"}" >/dev/null
  echo "    instância criada"
else
  echo "    instância já existia"
fi

echo "==> 5/6 apontando o webhook para a Ana"
curl -fsS -X POST "http://127.0.0.1:8080/webhook/set/ana" \
  -H "apikey: $EVOLUTION_KEY" -H "Content-Type: application/json" \
  -d "{\"webhook\":{\"enabled\":true,\"url\":\"http://host.docker.internal:$ZAP_PORTA/webhook\",\"byEvents\":false,\"base64\":false,\"events\":[\"MESSAGES_UPSERT\"]}}" >/dev/null
echo "    webhook configurado"

echo "==> 6/6 conectando a Ana ao Evolution"
if [ -f "$PASTA_ANA/.env" ]; then
  python3 - "$PASTA_ANA/.env" "$EVOLUTION_KEY" <<'PY'
import sys, re
caminho, chave = sys.argv[1], sys.argv[2]
texto = open(caminho).read()
def troca(t, k, v):
    if re.search(rf'^{k}=.*$', t, re.M):
        return re.sub(rf'^{k}=.*$', f'{k}={v}', t, flags=re.M)
    return t.rstrip() + f'\n{k}={v}\n'
texto = troca(texto, 'EVOLUTION_URL', 'http://localhost:8080')
texto = troca(texto, 'EVOLUTION_KEY', chave)
texto = troca(texto, 'EVOLUTION_INSTANCIA', 'ana')
open(caminho, 'w').write(texto)
print('    .env da Ana atualizado')
PY
  systemctl restart ana-whatsapp 2>/dev/null && echo "    serviço da Ana reiniciado" || echo "    reinicie manualmente: sudo systemctl restart ana-whatsapp"
else
  echo "    aviso: $PASTA_ANA/.env não existe. Rode antes: sudo bash deploy/instalar-vps.sh"
fi

echo
echo "==> Lendo o QR Code"
curl -fsS "http://127.0.0.1:8080/instance/connect/ana" -H "apikey: $EVOLUTION_KEY" \
  | python3 -c "
import sys, json, base64, re
d = json.load(sys.stdin)
b64 = d.get('base64') or ''
m = re.search(r'base64,(.*)', b64)
if m:
    open('qr.png','wb').write(base64.b64decode(m.group(1)))
    print('    QR salvo em ' + __import__('os').getcwd() + '/qr.png')
    print('    baixe esse arquivo e escaneie no WhatsApp: Aparelhos conectados > Conectar aparelho')
else:
    print('    sem QR na resposta. Se já pareou, ignore. Senão: curl -H \"apikey: \$EVOLUTION_KEY\" http://127.0.0.1:8080/instance/connect/ana')
"
echo
echo "Pronto. Número autorizado a falar com a Ana: $NUMERO"
echo "Coloque esse número em ZAP_PERMITIDOS no $PASTA_ANA/.env e reinicie o serviço."
