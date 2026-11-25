#!/usr/bin/env bash
# Sobe o Paperclip (orquestrador de agentes) na VPS e deixa como servico.
# Requer Node 24.11+ (instalador cuida disso). Uso:
#   sudo bash deploy/subir-paperclip.sh
set -euo pipefail

PORTA="${PORTA:-3100}"
USUARIO="ana"
DIR="/opt/paperclip"

echo "==> 1/6 verificando Node 24.11+"
NODE_OK=0
if command -v node >/dev/null 2>&1; then
  VER=$(node -p "process.versions.node" 2>/dev/null || echo 0)
  MAIOR=$(echo "$VER" | cut -d. -f1); MENOR=$(echo "$VER" | cut -d. -f2)
  if [ "$MAIOR" -gt 24 ] || { [ "$MAIOR" -eq 24 ] && [ "$MENOR" -ge 11 ]; }; then NODE_OK=1; fi
fi
if [ "$NODE_OK" -eq 0 ]; then
  echo "    instalando Node 24"
  curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash - >/dev/null
  sudo apt-get install -y -qq nodejs >/dev/null
  node -v
fi

echo "==> 2/6 preparando usuario e pasta"
id -u "$USUARIO" >/dev/null 2>&1 || sudo useradd -m -s /bin/bash "$USUARIO"
sudo mkdir -p "$DIR"
sudo chown -R "$USUARIO":"$USUARIO" "$DIR"

echo "==> 3/6 configurando o Paperclip (nao interativo)"
sudo -u "$USUARIO" bash -lc "cd $DIR && npx --yes paperclipai@latest onboard --yes --bind lan" || {
  echo "ATENCAO: o onboard falhou. Rode manualmente como usuario $USUARIO:"
  echo "  cd $DIR && npx --yes paperclipai@latest onboard --yes --bind lan"
  exit 1
}

echo "==> 4/6 registrando como servico"
if sudo -u "$USUARIO" bash -lc "cd $DIR && npx --yes paperclipai@latest service --help" >/dev/null 2>&1; then
  sudo -u "$USUARIO" bash -lc "cd $DIR && npx --yes paperclipai@latest service install" || true
fi

if ! systemctl list-unit-files 2>/dev/null | grep -qi paperclip; then
  echo "    criando servico systemd proprio"
  sudo tee /etc/systemd/system/paperclip.service >/dev/null <<'UNIT'
[Unit]
Description=Paperclip AI - orquestrador de agentes
After=network-online.target

[Service]
Type=simple
User=ana
WorkingDirectory=/opt/paperclip
Environment=NODE_ENV=production
ExecStart=/usr/bin/npx --yes paperclipai@latest up
Restart=always
RestartSec=10
StandardOutput=append:/var/log/ana/paperclip.log
StandardError=append:/var/log/ana/paperclip.log

[Install]
WantedBy=multi-user.target
UNIT
  sudo mkdir -p /var/log/ana && sudo chown -R "$USUARIO":"$USUARIO" /var/log/ana
  sudo systemctl daemon-reload
  sudo systemctl enable --now paperclip
fi

echo "==> 5/6 liberando a porta $PORTA so para a rede local da VPS"
if command -v ufw >/dev/null 2>&1; then
  sudo ufw allow "$PORTA"/tcp comment 'paperclip' >/dev/null 2>&1 || true
fi

echo "==> 6/6 conferindo"
sleep 6
if curl -fsS -m 5 "http://127.0.0.1:$PORTA/api/health" >/dev/null 2>&1; then
  echo "Paperclip respondendo em http://127.0.0.1:$PORTA"
else
  echo "Ainda nao respondeu. Veja os logs:"
  echo "  sudo journalctl -u paperclip -n 50 --no-pager"
  echo "  sudo tail -50 /var/log/ana/paperclip.log"
fi

cat <<TXT

======================================================
Paperclip no ar: http://IP-DA-VPS:$PORTA

Para a Ana aparecer como funcionaria:
1. abra a interface e conclua o onboarding criando a empresa "ANATECH MG"
2. em Agents, clique em Hire agent
3. nome: Ana | papel: Assistente executiva da ANATECH MG
4. adapter: Codex (usa a mesma OPENAI_API_KEY da Ana local)
5. budget mensal: comece com US\$ 20 e ajuste depois

A Ana que atende no WhatsApp continua rodando separada (servico ana-whatsapp).
As duas usam a mesma chave da OpenAI e o custo total aparece no painel da Ana.
======================================================
TXT
