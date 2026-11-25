#!/usr/bin/env node
// Ponte WhatsApp: recebe mensagem pela Evolution API, pensa com a Ana e responde.
// Sem dependências: http nativo. Configure no .env:
//   EVOLUTION_URL=http://localhost:8080
//   EVOLUTION_KEY=sua-chave
//   EVOLUTION_INSTANCIA=ana
//   ZAP_PERMITIDOS=5531989513698,5531999999999   (vazio = responde todos)
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { conversar, gasto, CONFIG } from './brain.js';

const RAIZ = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const envPath = path.join(RAIZ, '.env');
if (fs.existsSync(envPath)) {
  for (const linha of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = linha.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
CONFIG.apiKey = process.env.OPENAI_API_KEY || CONFIG.apiKey;

const URL_EVO = (process.env.EVOLUTION_URL || 'http://localhost:8080').replace(/\/$/, '');
const CHAVE_EVO = process.env.EVOLUTION_KEY || '';
const INSTANCIA = process.env.EVOLUTION_INSTANCIA || 'ana';
const PORTA = Number(process.env.ZAP_PORTA || 8787);
const PERMITIDOS = (process.env.ZAP_PERMITIDOS || '').split(',').map(s => s.replace(/\D/g, '')).filter(Boolean);
const MEMORIA_CONVERSA = new Map();
const VISTOS = new Set();

const soDigitos = j => String(j || '').split('@')[0].replace(/\D/g, '');

async function enviar(numero, texto) {
  const r = await fetch(`${URL_EVO}/message/sendText/${INSTANCIA}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: CHAVE_EVO },
    body: JSON.stringify({ number: numero, text: texto })
  });
  if (!r.ok) console.error('falha ao enviar:', r.status, (await r.text()).slice(0, 200));
}

function textoDaMensagem(dados) {
  const m = dados?.data?.message || dados?.message || {};
  return m.conversation || m.extendedTextMessage?.text || m.imageMessage?.caption ||
    m.videoMessage?.caption || dados?.data?.message?.buttonsResponseMessage?.selectedDisplayText || '';
}

const servidor = http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/saude') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ ok: true, instancia: INSTANCIA, gasto: gasto() }));
  }
  if (req.method !== 'POST') { res.writeHead(404); return res.end('nao encontrado'); }

  let corpo = '';
  req.on('data', c => { corpo += c; if (corpo.length > 2e6) req.destroy(); });
  req.on('end', async () => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end('{"ok":true}');

    let dados; try { dados = JSON.parse(corpo || '{}'); } catch { return; }
    const chave = dados?.data?.key || {};
    const id = chave.id || dados?.data?.id;
    if (id && VISTOS.has(id)) return;
    if (id) { VISTOS.add(id); if (VISTOS.size > 500) VISTOS.delete(VISTOS.values().next().value); }
    if (chave.fromMe) return;
    if (dados?.event && !String(dados.event).includes('messages.upsert')) return;

    const numero = soDigitos(chave.remoteJid || dados?.data?.from || dados?.sender);
    const texto = textoDaMensagem(dados).trim();
    if (!numero || !texto) return;
    if (PERMITIDOS.length && !PERMITIDOS.includes(numero)) return;

    const historico = MEMORIA_CONVERSA.get(numero) || [];
    try {
      const { texto: resposta, mensagens } = await conversar(historico, texto);
      MEMORIA_CONVERSA.set(numero, mensagens.filter(m => m.role === 'user' || (m.role === 'assistant' && !m.tool_calls))
        .map(m => ({ role: m.role, content: m.content })).slice(-12));
      await enviar(numero, resposta);
      console.log(`[${new Date().toLocaleTimeString('pt-BR')}] ${numero} → respondido (${resposta.length} caracteres)`);
    } catch (e) {
      console.error('erro ao responder', numero, e.message);
      await enviar(numero, 'Deixa eu confirmar com a equipe e já te retorno.');
    }
  });
});

servidor.listen(PORTA, () => {
  console.log(`Ana no WhatsApp ouvindo em http://localhost:${PORTA}/webhook`);
  console.log(`Evolution: ${URL_EVO} | instância: ${INSTANCIA}`);
  console.log('No Evolution, aponte o webhook da instância para esta URL (evento MESSAGES_UPSERT).');
});
