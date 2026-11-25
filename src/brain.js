// Cérebro da Ana: monta o contexto (identidade, regras, memórias, skills) e conversa com a OpenAI.
// Sem dependências externas: usa fetch nativo do Node 20+.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buscarMemorias, salvarMemoria, registrarMensagem } from './memory.js';
import { indiceSkills, lerSkill } from './skills.js';
import { ferramentas, executarFerramenta } from './tools.js';

const RAIZ = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

export const CONFIG = {
  apiKey: process.env.OPENAI_API_KEY || '',
  baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
  modelo: process.env.ANA_MODEL || 'gpt-4.1-mini',
  modeloBarato: process.env.ANA_MODEL_BARATO || 'gpt-4.1-nano',
  maxVoltas: Number(process.env.ANA_MAX_VOLTAS || 8)
};

let gastoTotal = { entrada: 0, saida: 0, chamadas: 0 };

function ler(rel) {
  try { return fs.readFileSync(path.join(RAIZ, rel), 'utf8'); } catch { return ''; }
}

function regras() {
  const dir = path.join(RAIZ, 'regras');
  if (!fs.existsSync(dir)) return '';
  return fs.readdirSync(dir).filter(f => f.endsWith('.md'))
    .map(f => `### ${f}\n${fs.readFileSync(path.join(dir, f), 'utf8')}`).join('\n\n');
}

export function contextoBase(pergunta = '') {
  const identidade = ler('identidade/IDENTITY.md');
  const memoria = buscarMemorias(pergunta, 8);
  const skills = indiceSkills();
  return [
    identidade,
    '## Regras permanentes do dono\n' + regras(),
    memoria.length ? '## Memórias relevantes\n' + memoria.map(m => '- ' + m.texto).join('\n') : '',
    skills.length ? '## Skills disponíveis (use a ferramenta ler_skill para abrir)\n' + skills.map(s => `- ${s.nome}: ${s.descricao}`).join('\n') : ''
  ].filter(Boolean).join('\n\n');
}

async function chamar(mensagens, opcoes = {}) {
  if (!CONFIG.apiKey) throw new Error('OPENAI_API_KEY não configurada. Coloque a chave no arquivo .env');
  const corpo = {
    model: opcoes.modelo || CONFIG.modelo,
    messages: mensagens,
    temperature: opcoes.temperatura ?? 0.4
  };
  if (opcoes.ferramentas) { corpo.tools = ferramentas; corpo.tool_choice = 'auto'; }

  const r = await fetch(CONFIG.baseUrl + '/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + CONFIG.apiKey },
    body: JSON.stringify(corpo)
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`OpenAI ${r.status}: ${t.slice(0, 300)}`);
  }
  const d = await r.json();
  const uso = d.usage || {};
  gastoTotal.entrada += uso.prompt_tokens || 0;
  gastoTotal.saida += uso.completion_tokens || 0;
  gastoTotal.chamadas += 1;
  return d.choices?.[0]?.message || {};
}

export function gasto() { return { ...gastoTotal }; }

// Conversa completa com uso de ferramentas locais.
export async function conversar(historico, pergunta, aoVivo = () => {}) {
  const mensagens = [
    { role: 'system', content: contextoBase(pergunta) },
    ...historico,
    { role: 'user', content: pergunta }
  ];
  registrarMensagem('user', pergunta);

  for (let volta = 0; volta < CONFIG.maxVoltas; volta++) {
    const msg = await chamar(mensagens, { ferramentas: true });
    if (msg.tool_calls?.length) {
      mensagens.push({ role: 'assistant', content: msg.content || '', tool_calls: msg.tool_calls });
      for (const chamada of msg.tool_calls) {
        let args = {};
        try { args = JSON.parse(chamada.function.arguments || '{}'); } catch {}
        aoVivo(`usando ${chamada.function.name}`);
        let saida;
        try { saida = await executarFerramenta(chamada.function.name, args); }
        catch (e) { saida = 'Erro: ' + e.message; }
        mensagens.push({ role: 'tool', tool_call_id: chamada.id, content: String(saida).slice(0, 12000) });
      }
      continue;
    }
    const texto = msg.content || '';
    registrarMensagem('assistant', texto);
    return { texto, mensagens };
  }
  return { texto: 'Parei porque cheguei no limite de ferramentas nesta pergunta.', mensagens };
}

export { salvarMemoria, lerSkill };
