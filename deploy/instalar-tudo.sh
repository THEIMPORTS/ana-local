#!/usr/bin/env bash
# Instala TUDO na VPS em sequencia: Ana (motor + painel), WhatsApp (Evolution) e Paperclip.
# Uso: sudo bash deploy/instalar-tudo.sh 5531989513698
# Opcoes: --sem-paperclip (pula o Paperclip) | --seco (so confere, nao instala)
set -uo pipefail

TELEFONE=""; COM_PAPERCLIP=1; SECO=0
for arg in "$@"; do
  case "$arg" in
    --sem-paperclip) COM_PAPERCLIP=0 ;;
    --seco) SECO=1 ;;
    -*) echo "Opcao desconhecida: $arg"; exit 1 ;;
    *) TELEFONE="$arg" ;;
  esac
done

AQUI="$(cd "$(dirname "$0")" && pwd)"
TELEFONE_LIMPO=$(echo "$TELEFONE" | tr -dc '0-9')

linha() { printf '%s\n' "-----------------------------------------------------"; }
titulo() { echo; linha; echo "$1"; linha; }

if [ "$SECO" = "0" ] && [ "$(id -u)" != "0" ]; then
  echo "Rode com sudo: sudo bash deploy/instalar-tudo.sh $TELEFONE"
  exit 1
fi

titulo "1 de 4 - conferindo a maquina"
echo "Sistema : $(. /etc/os-release 2>/dev/null && echo "$PRETTY_NAME" || echo desconhecido)"
echo "Memoria : $(free -m 2>/dev/null | awk '/^Mem:/{print $2" MB"}')"
echo "Disco   : $(df -h / | awk 'NR==2{print $4" livres"}')"
echo "Node    : $(node -v 2>/dev/null || echo 'nao instalado, o instalador resolve')"
echo "Docker  : $(docker -v 2>/dev/null || echo 'nao instalado, o instalador resolve')"
echo "Telefone: ${TELEFONE_LIMPO:-nao informado}"

if [ "$SECO" = "1" ]; then
  echo; echo "Modo seco: nada foi instalado."
  echo "Para instalar de verdade: sudo bash deploy/instalar-tudo.sh $TELEFONE"
  exit 0
fi

titulo "2 de 4 - Ana: motor, memoria e painel de custo"
bash "$AQUI/instalar-vps.sh" || { echo "FALHOU na Ana. Corrija e rode de novo, o script retoma daqui."; exit 1; }

titulo "3 de 4 - WhatsApp pela Evolution API"
if [ -n "$TELEFONE_LIMPO" ]; then
  bash "$AQUI/subir-whatsapp.sh" "$TELEFONE_LIMPO" || echo "ATENCAO: WhatsApp nao subiu. Rode so ele: sudo bash deploy/subir-whatsapp.sh $TELEFONE_LIMPO"
else
  echo "Sem telefone informado, pulei o WhatsApp. Depois: sudo bash deploy/subir-whatsapp.sh SEU-NUMERO"
fi

titulo "4 de 4 - Paperclip, o time de agentes"
if [ "$COM_PAPERCLIP" = "1" ]; then
  bash "$AQUI/subir-paperclip.sh" || echo "ATENCAO: Paperclip nao subiu. Rode so ele: sudo bash deploy/subir-paperclip.sh"
else
  echo "Pulado a pedido."
fi

IP=$(curl -fsS --max-time 8 https://api.ipify.org 2>/dev/null || echo "IP-DA-VPS")
titulo "Pronto. O que voce faz agora"
echo "1. Coloque sua chave da OpenAI:"
echo "     sudo nano /opt/ana/.env   e preencha OPENAI_API_KEY=sk-..."
echo "     sudo systemctl restart ana-whatsapp"
echo
echo "2. Leia o QR Code do WhatsApp:"
echo "     sudo ls /opt/ana/deploy/qr.png"
echo "     abra o arquivo e escaneie em Aparelhos conectados"
echo
echo "3. Painel de custo:  http://$IP:8788"
echo "4. Paperclip:        http://$IP:3100"
echo "5. Conversar no terminal:"
echo "     sudo -u ana bash -lc 'cd /opt/ana && node src/index.js'"
echo
echo "Status: sudo systemctl status ana-whatsapp ana-painel paperclip"
echo "Logs  : sudo journalctl -u ana-whatsapp -f"
