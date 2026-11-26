// Rotinas da ANATECH MG: briefing matinal, conferência de caixa e pauta editorial.
// Uso: node src/rotinas.js briefing | caixa | editorial
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const ESTADO = path.join(RAIZ, 'estado');
const brl = v => 'R$ ' + Number(v || 0).toFixed(2).replace('.', ',');

function ler(nome) {
  const p = path.join(ESTADO, nome + '.json');
  if (!fs.existsSync(p)) return null;
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; }
}

function custoDoDia() {
  const p = path.join(RAIZ, 'memoria', 'gastos.jsonl');
  if (!fs.existsSync(p)) return { chamadas: 0, tokens: 0, custo: 0 };
  const hoje = new Date().toISOString().slice(0, 10);
  let c = 0, t = 0, v = 0;
  for (const l of fs.readFileSync(p, 'utf8').split('\n')) {
    if (!l.trim()) continue;
    try {
      const r = JSON.parse(l);
      if (!String(r.ts || '').startsWith(hoje)) continue;
      c++; t += (r.entrada || 0) + (r.saida || 0); v += r.custo || 0;
    } catch {}
  }
  return { chamadas: c, tokens: t, custo: v };
}

function briefing() {
  const crm = ler('crm');
  const atend = ler('atendimento');
  const editorial = ler('editorial');
  const caixa = ler('caixa');
  const custo = custoDoDia();

  const andou = [];
  const travou = [];
  const decide = [];

  if (atend) {
    if (atend.respondidas) andou.push(`${atend.respondidas} conversas respondidas no WhatsApp`);
    if (atend.sem_resposta) travou.push(`${atend.sem_resposta} conversas sem resposta`);
  } else travou.push('atendimento: sem registro do dia');

  if (crm) {
    if (crm.leads_novos) andou.push(`${crm.leads_novos} leads novos no CRM`);
    if (crm.parados_3d) travou.push(`${crm.parados_3d} leads parados há 3 dias ou mais`);
    if (crm.propostas_abertas) decide.push(`${crm.propostas_abertas} propostas abertas esperando resposta`);
  } else travou.push('CRM: sem registro');

  if (editorial) {
    if (editorial.publicados) andou.push(`${editorial.publicados} posts publicados`);
    if (editorial.aguardando_aprovacao) decide.push(`${editorial.aguardando_aprovacao} peças esperando sua aprovação`);
  } else travou.push('editorial: sem registro');

  if (caixa) {
    const entradaCaixa = (caixa.entradas_lista || []).reduce((t, e) => t + Number(e.valor || 0), 0);
    if (caixa.fechado) andou.push(`caixa conferido: ${brl(entradaCaixa)} de entrada`);
    else travou.push('caixa ainda não conferido hoje');
    if (caixa.divergencias && caixa.divergencias.length) decide.push(`${caixa.divergencias.length} divergência(s) de caixa para olhar`);
  } else travou.push('financeiro: sem registro de caixa');

  const linhas = [
    'BRIEFING — ANATECH MG',
    new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
    '',
    'ANDOU',
    ...(andou.length ? andou.map(x => '  ' + x) : ['  nada registrado']),
    '',
    'TRAVOU',
    ...(travou.length ? travou.map(x => '  ' + x) : ['  nada travado']),
    '',
    'ESPERA SUA DECISÃO',
    ...(decide.length ? decide.map(x => '  ' + x) : ['  nada pendente']),
    '',
    `CUSTO DE IA HOJE: ${brl(custo.custo)} em ${custo.chamadas} chamadas (${custo.tokens} tokens)`
  ];
  return linhas.join('\n');
}

function caixa() {
  const c = ler('caixa');
  if (!c) return 'Sem registro de caixa. Crie estado/caixa.json com entradas, saidas e vendas.';
  const entradas = (c.entradas_lista || []).reduce((s, e) => s + Number(e.valor || 0), 0);
  const saidas = (c.saidas_lista || []).reduce((s, e) => s + Number(e.valor || 0), 0);
  const vendas = (c.vendas_lista || []).reduce((s, e) => s + Number(e.valor || 0), 0);
  const dif = Math.abs(entradas - vendas);
  const out = [
    'CONFERÊNCIA DE CAIXA — ' + new Date().toLocaleDateString('pt-BR'),
    `Entradas registradas: ${brl(entradas)}`,
    `Vendas registradas:   ${brl(vendas)}`,
    `Saídas:               ${brl(saidas)}`,
    `Saldo do dia:         ${brl(entradas - saidas)}`,
    '',
    dif < 0.01 ? 'Caixa bate com as vendas.' : `DIVERGÊNCIA de ${brl(dif)} entre caixa e vendas. Não corrijo sozinha: confira a lista.`
  ];
  return out.join('\n');
}

function editorial() {
  const e = ler('editorial');
  if (!e || !e.semana) return 'Sem pauta registrada. Crie estado/editorial.json com a chave semana.';
  const linhas = ['PAUTA DA SEMANA — ANATECH MG', ''];
  e.semana.forEach((p, i) => linhas.push(`${i + 1}. ${p.dia}: ${p.tema}${p.formato ? ' (' + p.formato + ')' : ''}`));
  if (e.aguardando_aprovacao) linhas.push('', `${e.aguardando_aprovacao} peça(s) esperando sua aprovação.`);
  return linhas.join('\n');
}

const acao = process.argv[2] || 'briefing';
const saida = acao === 'caixa' ? caixa() : acao === 'editorial' ? editorial() : briefing();
console.log(saida);
