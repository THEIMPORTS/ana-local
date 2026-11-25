// Painel de custo da Ana: http://localhost:8788
import http from 'node:http';
import { resumo, precoConfigurado } from './custo.js';

const PORTA = Number(process.env.PAINEL_PORTA || 8788);
const PAPERCLIP = (process.env.PAPERCLIP_URL || '').replace(/\/$/, '');

async function statusPaperclip() {
  if (!PAPERCLIP) return { configurado: false };
  try {
    const r = await fetch(PAPERCLIP + '/api/health', { signal: AbortSignal.timeout(2500) });
    return { configurado: true, online: r.ok, codigo: r.status, url: PAPERCLIP };
  } catch (e) {
    return { configurado: true, online: false, erro: e.message.slice(0, 60), url: PAPERCLIP };
  }
}
const brl = v => 'R$ ' + Number(v || 0).toFixed(2).replace('.', ',');
const n = v => Number(v || 0).toLocaleString('pt-BR');

function html(pc = {}) {
  const r = resumo();
  const linhas = r.dias.map(d => `<tr><td>${d.dia}</td><td>${n(d.chamadas)}</td><td>${n(d.entrada)}</td><td>${n(d.saida)}</td><td>${brl(d.custo)}</td></tr>`).join('') || '<tr><td colspan="5" class="vazio">Nenhum uso registrado ainda</td></tr>';
  const modelos = r.porModelo.map(m => `<tr><td>${m.modelo}</td><td>${n(m.chamadas)}</td><td>${n(m.entrada + m.saida)}</td><td>${brl(m.custo)}</td></tr>`).join('') || '<tr><td colspan="4" class="vazio">Sem chamadas</td></tr>';
  const aviso = precoConfigurado() ? '' : '<p class="aviso">Os valores em reais ficam zerados até você preencher PRECO_ENTRADA e PRECO_SAIDA no .env com o preço por 1 milhão de tokens da sua conta OpenAI.</p>';
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Painel de custo · Ana</title><style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Poppins',system-ui,sans-serif;background:#F5F5F3;color:#001336;padding:28px}
.wrap{max-width:860px;margin:0 auto}
h1{font-size:22px;margin-bottom:4px}
p.sub{color:#5A6072;font-size:13px;margin-bottom:22px}
.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:24px}
.kpi{background:#fff;border:1px solid #E3E3DE;border-radius:14px;padding:16px}
.kpi span{display:block;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#6D7A93;margin-bottom:6px}
.kpi b{font-size:24px;letter-spacing:-.02em}
.kpi small{display:block;color:#5A6072;font-size:11px;margin-top:4px}
h2{font-size:14px;margin:22px 0 8px;text-transform:uppercase;letter-spacing:.08em;color:#12386B}
table{width:100%;border-collapse:collapse;background:#fff;border:1px solid #E3E3DE;border-radius:12px;overflow:hidden;font-size:13px}
th,td{padding:10px 12px;text-align:left;border-bottom:1px solid #EFEFEA}
th{background:#FAFAF7;font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#6D7A93}
tr:last-child td{border-bottom:none}
.vazio{text-align:center;color:#8A94A6;padding:18px}
.aviso{background:#FFF4E5;border:1px solid #FFD9A8;color:#7A4B00;padding:10px 12px;border-radius:10px;font-size:12px;margin-bottom:18px}
footer{margin-top:26px;font-size:11px;color:#8A94A6}
</style></head><body><div class="wrap">
<h1>Painel de custo · Ana</h1>
<p class="sub">Gasto da sua chave da OpenAI, atualizado a cada chamada</p>
${aviso}
<div class="kpis">
  <div class="kpi"><span>Hoje</span><b>${brl(r.hoje.custo)}</b><small>${n(r.hoje.chamadas)} chamadas · ${n(r.hoje.entrada + r.hoje.saida)} tokens</small></div>
  <div class="kpi"><span>Este mês</span><b>${brl(r.mes.custo)}</b><small>${n(r.mes.chamadas)} chamadas</small></div>
  <div class="kpi"><span>Total</span><b>${brl(r.total.custo)}</b><small>${n(r.total.entrada + r.total.saida)} tokens</small></div>
</div>
${pc.configurado ? `<div class="kpi" style="margin-bottom:24px;border-color:${pc.online?'#009CFE':'#E3A008'}">
  <span>Paperclip (orquestrador de agentes)</span>
  <b style="font-size:16px">${pc.online ? 'online' : 'sem resposta'}</b>
  <small>${pc.url}${pc.erro ? ' · ' + pc.erro : ''}</small>
</div>` : `<div class="kpi" style="margin-bottom:24px">
  <span>Paperclip</span><b style="font-size:16px">não configurado</b>
  <small>preencha PAPERCLIP_URL no .env para acompanhar aqui</small>
</div>`}
<h2>Últimos dias</h2>
<table><tr><th>Dia</th><th>Chamadas</th><th>Tokens entrada</th><th>Tokens saída</th><th>Custo</th></tr>${linhas}</table>
<h2>Por modelo</h2>
<table><tr><th>Modelo</th><th>Chamadas</th><th>Tokens</th><th>Custo</th></tr>${modelos}</table>
<footer>ANATECH MG · painel local, nenhum dado sai da sua máquina</footer>
</div></body></html>`;
}

http.createServer(async (req, res) => {
  if (req.url === '/dados') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(resumo()));
  }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  const pc = await statusPaperclip();
  res.end(html(pc));
}).listen(PORTA, () => console.log('Painel de custo em http://localhost:' + PORTA));
