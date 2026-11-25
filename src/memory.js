// Memória da Ana: arquivos JSONL, sem banco, sem dependência.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DIR = path.join(RAIZ, 'memoria');
const ARQ_MEM = path.join(DIR, 'memorias.jsonl');
const ARQ_CONV = path.join(DIR, 'conversas.jsonl');

function garantir() { fs.mkdirSync(DIR, { recursive: true }); }

function anexar(arquivo, objeto) {
  garantir();
  fs.appendFileSync(arquivo, JSON.stringify(objeto) + '\n');
}

function lerTudo(arquivo) {
  garantir();
  if (!fs.existsSync(arquivo)) return [];
  return fs.readFileSync(arquivo, 'utf8').split('\n').filter(Boolean)
    .map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
}

export function salvarMemoria(texto, categoria = 'Geral') {
  if (!texto || texto.trim().length < 8) return { ok: false, motivo: 'texto curto' };
  const item = { id: Date.now().toString(36), ts: new Date().toISOString(), categoria, texto: texto.trim() };
  anexar(ARQ_MEM, item);
  return { ok: true, id: item.id };
}

export function registrarMensagem(papel, texto) {
  anexar(ARQ_CONV, { ts: new Date().toISOString(), papel, texto });
}

// Busca simples por palavras: suficiente para milhares de memórias e roda instantâneo.
export function buscarMemorias(consulta = '', limite = 8) {
  const todas = lerTudo(ARQ_MEM);
  if (!todas.length) return [];
  const termos = String(consulta).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .split(/\W+/).filter(p => p.length > 3);
  if (!termos.length) return todas.slice(-limite).reverse();
  const pontuadas = todas.map(m => {
    const alvo = (m.texto + ' ' + m.categoria).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return { ...m, nota: termos.reduce((s, t) => s + (alvo.includes(t) ? 1 : 0), 0) };
  }).filter(m => m.nota > 0);
  pontuadas.sort((a, b) => b.nota - a.nota || (b.ts > a.ts ? 1 : -1));
  return pontuadas.slice(0, limite);
}

export function listarMemorias(limite = 50) { return lerTudo(ARQ_MEM).slice(-limite).reverse(); }
export function totalMemorias() { return lerTudo(ARQ_MEM).length; }
export function historicoRecente(limite = 12) {
  return lerTudo(ARQ_CONV).slice(-limite).map(m => ({ role: m.papel, content: m.texto }));
}
