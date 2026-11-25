#!/usr/bin/env node
// Ana no terminal: chat direto com a sua chave da OpenAI.
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';
import { conversar, gasto, CONFIG } from './brain.js';
import { historicoRecente, totalMemorias, salvarMemoria, listarMemorias } from './memory.js';
import { indiceSkills } from './skills.js';

const RAIZ = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

// carrega .env simples, sem dependência
const envPath = path.join(RAIZ, '.env');
if (fs.existsSync(envPath)) {
  for (const linha of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = linha.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  CONFIG.apiKey = process.env.OPENAI_API_KEY || CONFIG.apiKey;
  CONFIG.modelo = process.env.ANA_MODEL || CONFIG.modelo;
}

const azul = t => `\x1b[36m${t}\x1b[0m`;
const cinza = t => `\x1b[90m${t}\x1b[0m`;
const laranja = t => `\x1b[38;5;208m${t}\x1b[0m`;

console.log(laranja('\n  ANA · ANATECH MG  ') + cinza('terminal local'));
console.log(cinza(`  modelo: ${CONFIG.modelo} | memórias: ${totalMemorias()} | skills: ${indiceSkills().length}`));
if (!CONFIG.apiKey) console.log(laranja('  falta a OPENAI_API_KEY no arquivo .env\n'));
console.log(cinza('  /mem <texto> guarda memória · /memorias lista · /skills lista · /gasto custo · /sair\n'));

const rl = readline.createInterface({ input: process.stdin, output: process.stdout, prompt: laranja('você › ') });
let historico = historicoRecente(10);

function perguntar() {
  rl.prompt();
  rl.once('line', async linha => {
    const texto = linha.trim();
    if (!texto) return perguntar();

    if (texto === '/sair') { rl.close(); return; }
    if (texto === '/gasto') {
      const g = gasto();
      console.log(cinza(`chamadas: ${g.chamadas} | tokens entrada: ${g.entrada} | saída: ${g.saida}`));
      return perguntar();
    }
    if (texto === '/skills') {
      console.log(cinza(indiceSkills().map(s => s.nome).join(', ').slice(0, 2000)));
      return perguntar();
    }
    if (texto === '/memorias') {
      console.log(cinza(listarMemorias(15).map(m => `[${m.categoria}] ${m.texto}`).join('\n') || 'nenhuma ainda'));
      return perguntar();
    }
    if (texto.startsWith('/mem ')) {
      const r = salvarMemoria(texto.slice(5));
      console.log(cinza(r.ok ? 'memória guardada' : 'não guardei: ' + r.motivo));
      return perguntar();
    }

    try {
      process.stdout.write(cinza('  pensando...\r'));
      const { texto: resposta, mensagens } = await conversar(historico, texto, t => process.stdout.write(cinza(`  ${t}...\r`)));
      process.stdout.write(' '.repeat(40) + '\r');
      console.log(azul('ana › ') + resposta + '\n');
      historico = mensagens.filter(m => m.role === 'user' || (m.role === 'assistant' && !m.tool_calls))
        .map(m => ({ role: m.role, content: m.content })).slice(-12);
    } catch (e) {
      console.log(laranja('erro: ') + e.message);
    }
    perguntar();
  });
}

perguntar();
