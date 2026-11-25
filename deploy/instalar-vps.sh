#!/usr/bin/env bash
# Instala a Ana na VPS (Ubuntu 22.04/24.04) como serviço que reinicia sozinho.
# Uso: sudo bash deploy/instalar-vps.sh
set -euo pipefail

ORIGEM="$(cd "$(dirname "$0")/.." && pwd)"
DESTINO=/opt/ana

if [ "$(id -u)" -ne 0 ]; then
  echo "Rode com sudo: sudo bash deploy/instalar-vps.sh"
  exit 1
fi

echo "==> 1/6 Node.js 20"
if ! command -v node >/dev/null 2>&1 || [ "$(node -p 'process.versions.node.split(".")[0]')" -lt 20 ]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
echo "    $(node -v)"

echo "==> 2/6 usuário de serviço"
id -u ana >/dev/null 2>&1 || useradd --system --create-home --shell /usr/sbin/nologin ana

echo "==> 3/6 copiando o sistema para $DESTINO"
mkdir -p "$DESTINO"
cp -r "$ORIGEM/src" "$ORIGEM/identidade" "$ORIGEM/regras" "$ORIGEM/package.json" "$DESTINO"/
mkdir -p "$DESTINO/memoria" "$DESTINO/projetos" "$DESTINO/skills" /var/log/ana
if [ -d "$ORIGEM/skills" ]; then cp -r "$ORIGEM/skills/." "$DESTINO/skills/" 2>/dev/null || true; fi
if [ -f "$ORIGEM/memoria/memorias.jsonl" ]; then cp "$ORIGEM/memoria/memorias.jsonl" "$DESTINO/memoria/"; fi

if [ ! -f "$DESTINO/.env" ]; then
  cp "$ORIGEM/.env.example" "$DESTINO/.env"
  echo "    criei $DESTINO/.env"
fi

echo "==> 4/6 permissões"
chown -R ana:ana "$DESTINO" /var/log/ana
chmod 600 "$DESTINO/.env"

echo "==> 5/6 serviços"
cp "$ORIGEM/deploy/ana-whatsapp.service" /etc/systemd/system/
cp "$ORIGEM/deploy/ana-painel.service" /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now ana-whatsapp ana-painel

echo "==> 6/6 status"
sleep 3
systemctl is-active ana-whatsapp ana-painel || true

cat <<FIM

======================================================
Ana instalada em $DESTINO

Antes de usar, edite a chave:
  sudo nano $DESTINO/.env
  (preencha OPENAI_API_KEY, EVOLUTION_* e, se quiser, PRECO_ENTRADA e PRECO_SAIDA)

Depois reinicie:
  sudo systemctl restart ana-whatsapp ana-painel

Acompanhar:
  sudo journalctl -u ana-whatsapp -f
  sudo tail -f /var/log/ana/whatsapp.log

Painel de custo:
  http://IP-DA-VPS:8788

Se o painel precisa ficar privado, libere a porta só para o seu IP:
  sudo ufw allow from SEU-IP to any port 8788
======================================================
FIM
