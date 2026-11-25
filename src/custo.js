// Registro de gasto: uma linha por chamada em memoria/gastos.jsonl
// Preço por 1 milhão de tokens vem do .env (PRECO_ENTRADA / PRECO_SAIDA).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const ARQ = path.join(RAIZ, 'memoria', 'gastos.jsonl');

const num = v => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const PRECO_ENTRADA = num(process.env.PRECO_ENTRADA);
const PRECO_SAIDA = num(process.env.PRECO_SAIDA);

export function registrarUso({ modelo = '', entrada = 0, saida = 0, canal = 'terminal', etiqueta = '' }) {
  const custo = (entrada / 1e6) * PRECO_ENTRADA + (saida / 1e6) * PRECO_SAIDA;
  const linha = {
    ts: new Date().toISOString(),
    modelo,
    entrada,
    saida,
    custo: Number(custo.toFixed(6)),
    canal,
    etiqueta
  };
  try {
    fs.mkdirSync(path.dirname(ARQ), { recursive: true });
    fs.appendFileSync(ARQ, JSON.stringify(linha) + '\n');
  } catch (e) { /* nunca derruba a conversa por causa do log */ }
  return linha;
}

export function lerUso() {
  if (!fs.existsSync(ARQ)) return [];
  return fs.readFileSync(ARQ, 'utf8').split('\n').filter(Boolean).map(l => {
    try { return JSON.parse(l); } catch { return null; }
  }).filter(Boolean);
}

const diaBR = d => new Date(d).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });

export function resumo() {
  const linhas = lerUso();
  const hoje = diaBR(new Date());
  const mesAtual = hoje.slice(3); // MM/AAAA
  const acc = (arr) => arr.reduce((a, l) => ({
    chamadas: a.chamadas + 1,
    entrada: a.entrada + l.entrada,
    saida: a.saida + l.saida,
    custo: a.custo + l.custo
  }), { chamadas: 0, entrada: 0, saida: 0, custo: 0 });

  const porDia = {};
  const porModelo = {};
  for (const l of linhas) {
    const d = diaBR(l.ts);
    porDia[d] = porDia[d] || [];
    porDia[d].push(l);
    const m = l.modelo || 'desconhecido';
    porModelo[m] = porModelo[m] || [];
    porModelo[m].push(l);
  }

  const dias = Object.entries(porDia).sort((a, b) => {
    const [da, ma, aa] = a[0].split('/'); const [db, mb, ab] = b[0].split('/');
    return new Date(`${ab}-${mb}-${da}`) - new Date(`${aa}-${ma}-${da}`);
  }).slice(0, 14).map(([dia, arr]) => ({ dia, ...acc(arr) }));

  return {
    hoje: { dia: hoje, ...acc(porDia[hoje] || []) },
    mes: { periodo: mesAtual, ...acc(linhas.filter(l => diaBR(l.ts).endsWith(mesAtual))) },
    total: acc(linhas),
    porModelo: Object.entries(porModelo).map(([modelo, arr]) => ({ modelo, ...acc(arr) })),
    dias
  };
}

export function precoConfigurado() {
  return PRECO_ENTRADA > 0 || PRECO_SAIDA > 0;
}
