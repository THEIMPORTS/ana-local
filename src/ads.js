// Agente de trafego pago: monta plano de campanha, analisa desempenho e propoe acoes.
// Uso:
//   node src/ads.js plano --produto "Pacote IA" --orcamento 40 --cidade "Belo Horizonte" --cpa 60
//   node src/ads.js analisar --csv estado/ads/exemplo-google.csv --plataforma google --cpa 60
//   node src/ads.js credenciais
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const cmd = args[0] || 'ajuda';
const flag = (nome, padrao = '') => {
  const i = args.indexOf('--' + nome);
  return i >= 0 && args[i + 1] ? args[i + 1] : padrao;
};
const num = (v, p = 0) => { const n = Number(String(v).replace(',', '.')); return isFinite(n) ? n : p; };
const brl = v => 'R$ ' + v.toFixed(2).replace('.', ',');
const slug = t => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function plano() {
  const produto = flag('produto', 'Pacote IA');
  const orcamento = num(flag('orcamento', '40'), 40);
  const cidade = flag('cidade', 'Belo Horizonte');
  const cpa = num(flag('cpa', '60'), 60);
  const dias = num(flag('dias', '30'), 30);
  const total = orcamento * dias;

  const grupos = [
    { nome: 'Atendimento 24h', intencao: 'quem procura atendimento automatico', termos: ['atendimento automatico whatsapp', 'chatbot whatsapp empresa', 'responder cliente automatico', 'atendimento 24 horas'] },
    { nome: 'Captacao de leads', intencao: 'quem quer gerar lead', termos: ['gerar leads whatsapp', 'captar clientes automatico', 'agente de ia para vendas'] },
    { nome: 'Por segmento', intencao: 'quem busca solucao do seu nicho', termos: [produto.toLowerCase() + ' ' + cidade.toLowerCase(), produto.toLowerCase() + ' para clinica', produto.toLowerCase() + ' para salao'] }
  ];
  const negativas = ['gratis', 'curso gratis', 'apostila', 'emprego', 'vaga', 'salario', 'como fazer sozinho', 'pdf', 'torrent', 'download gratis'];

  const linhas = [];
  linhas.push(`# Plano de campanha: ${produto}`);
  linhas.push(`Plataformas: Google Ads (Rede de Pesquisa) e TikTok Ads (in-feed)`);
  linhas.push(`Regiao: ${cidade} | Orcamento diario: ${brl(orcamento)} | Periodo: ${dias} dias | Teto do periodo: ${brl(total)}`);
  linhas.push(`CPA alvo: ${brl(cpa)} | Conversoes esperadas no teto: ${Math.floor(total / cpa)}`);
  linhas.push('');
  linhas.push('## Estrutura');
  grupos.forEach((g, i) => {
    linhas.push(`${i + 1}. Grupo "${g.nome}" (${g.intencao})`);
    linhas.push(`   Palavras: ${g.termos.join(' | ')}`);
  });
  linhas.push('');
  linhas.push('## Palavras negativas (obrigatorias em todos os grupos)');
  linhas.push('   ' + negativas.join(', '));
  linhas.push('');
  linhas.push('## Como dividir o dinheiro');
  linhas.push(`   Google Pesquisa: ${brl(orcamento * 0.6)} por dia (intencao alta, converte melhor)`);
  linhas.push(`   TikTok in-feed: ${brl(orcamento * 0.4)} por dia (descoberta, testa criativo)`);
  linhas.push('');
  linhas.push('## Regras que o agente segue sem perguntar');
  linhas.push(`   1. Nunca passa de ${brl(orcamento)} por dia somando as duas plataformas`);
  linhas.push(`   2. Pausa palavra ou anuncio que gastou ${brl(cpa)} sem nenhuma conversao`);
  linhas.push(`   3. Escala orcamento em 20% so quando o CPA esta abaixo de ${brl(cpa * 0.7)} por 3 dias`);
  linhas.push('   4. Qualquer mudanca acima de 30% do orcamento espera aprovacao do dono');
  linhas.push('   5. Nada de promessa de ganho, rendimento ou resultado garantido no anuncio');
  linhas.push('   6. Anuncio de rifa e de QuantBot passa por revisao humana antes de subir');
  linhas.push('');
  linhas.push('## O que ainda falta para subir de verdade');
  linhas.push('   Google Ads: developer token, customer ID, OAuth do MCC (variaveis GOOGLE_ADS_*)');
  linhas.push('   TikTok Ads: app ID, secret e advertiser ID (variaveis TIKTOK_ADS_*)');
  linhas.push('   Sem isso o agente monta o plano e o CSV, mas nao sobe campanha.');

  const texto = linhas.join('\n');
  const pasta = path.join('estado', 'ads');
  fs.mkdirSync(pasta, { recursive: true });
  const base = path.join(pasta, 'plano-' + slug(produto));
  fs.writeFileSync(base + '.md', texto);
  const csv = ['Campanha,Grupo de anuncios,Palavra-chave,Correspondencia,Lance inicial'];
  grupos.forEach(g => g.termos.forEach(t => csv.push(`${produto},${g.nome},"${t}",ampla,${(cpa * 0.1).toFixed(2)}`)));
  csv.push('');
  csv.push('Negativas,,,' + negativas.join('|') + ',');
  fs.writeFileSync(base + '.csv', csv.join('\n'));
  console.log(texto);
  console.log('\nArquivos salvos:\n  ' + base + '.md\n  ' + base + '.csv');
}

function lerCsv(caminho) {
  const bruto = fs.readFileSync(caminho, 'utf8').replace(/\r/g, '').trim();
  const linhas = bruto.split('\n').filter(l => l.trim());
  const sep = (linhas[0].match(/;/g) || []).length > (linhas[0].match(/,/g) || []).length ? ';' : ',';
  const cab = linhas[0].split(sep).map(c => c.trim().toLowerCase().replace(/^"|"$/g, ''));
  const acha = (alvos) => cab.findIndex(c => alvos.some(a => c.includes(a)));
  const idx = {
    campanha: acha(['campanha', 'campaign']),
    grupo: acha(['grupo', 'ad group', 'adgroup']),
    termo: acha(['palavra', 'keyword', 'termo', 'ad name', 'anuncio']),
    impressoes: acha(['impress', 'exibi']),
    cliques: acha(['clique', 'click']),
    custo: acha(['custo', 'cost', 'spend', 'gasto']),
    conversoes: acha(['convers', 'conv'])
  };
  return linhas.slice(1).map(l => {
    const c = l.split(sep).map(x => x.trim().replace(/^"|"$/g, ''));
    const pega = k => (idx[k] >= 0 ? c[idx[k]] : '');
    return {
      campanha: pega('campanha'), grupo: pega('grupo'), termo: pega('termo'),
      impressoes: num(pega('impressoes')), cliques: num(pega('cliques')),
      custo: num(pega('custo')), conversoes: num(pega('conversoes'))
    };
  }).filter(r => r.custo > 0 || r.cliques > 0);
}

function analisar() {
  const csv = flag('csv');
  if (!csv || !fs.existsSync(csv)) { console.log('Informe um CSV exportado: --csv caminho.csv'); process.exit(1); }
  const plataforma = flag('plataforma', 'google');
  const cpaAlvo = num(flag('cpa', '60'), 60);
  const dados = lerCsv(csv);
  if (!dados.length) { console.log('CSV sem linhas com custo ou clique.'); return; }

  const custo = dados.reduce((t, r) => t + r.custo, 0);
  const conv = dados.reduce((t, r) => t + r.conversoes, 0);
  const cliques = dados.reduce((t, r) => t + r.cliques, 0);
  const impr = dados.reduce((t, r) => t + r.impressoes, 0);
  const cpa = conv ? custo / conv : 0;
  const ctr = impr ? (cliques / impr) * 100 : 0;
  const cpc = cliques ? custo / cliques : 0;

  const acoes = [];
  dados.forEach(r => {
    const cpaItem = r.conversoes ? r.custo / r.conversoes : Infinity;
    const nome = r.termo || r.grupo || r.campanha;
    if (r.custo >= cpaAlvo && r.conversoes === 0) acoes.push({ tipo: 'pausar', alvo: nome, motivo: `gastou ${brl(r.custo)} sem converter` });
    else if (r.conversoes > 0 && cpaItem <= cpaAlvo * 0.7) acoes.push({ tipo: 'escalar', alvo: nome, motivo: `CPA ${brl(cpaItem)}, abaixo de ${brl(cpaAlvo * 0.7)}` });
    else if (r.conversoes === 0 && r.cliques >= 30) acoes.push({ tipo: 'trocar criativo', alvo: nome, motivo: `${r.cliques} cliques e nenhuma conversao` });
  });
  if (ctr && ctr < 1) acoes.push({ tipo: 'revisar anuncio', alvo: 'campanha inteira', motivo: `CTR ${ctr.toFixed(2)}% abaixo de 1%` });

  const linhas = [];
  linhas.push(`# Analise de ${plataforma.toUpperCase()} — ${new Date().toLocaleDateString('pt-BR')}`);
  linhas.push(`Custo: ${brl(custo)} | Cliques: ${cliques} | Conversoes: ${conv} | CPA: ${conv ? brl(cpa) : 'sem conversao'} | CTR: ${ctr.toFixed(2)}% | CPC: ${brl(cpc)}`);
  linhas.push(`CPA alvo: ${brl(cpaAlvo)}`);
  linhas.push('');
  linhas.push('## Acoes propostas');
  if (!acoes.length) linhas.push('  Nada a mudar hoje: tudo dentro da faixa.');
  acoes.forEach((a, i) => linhas.push(`${i + 1}. ${a.tipo.toUpperCase()}: ${a.alvo} — ${a.motivo}`));
  linhas.push('');
  linhas.push('## Antes de executar');
  linhas.push('  Pausar e negativar: pode fazer direto.');
  linhas.push('  Escalar orcamento: espera aprovacao do dono acima de 30%.');
  linhas.push('  Nada aqui e promessa de resultado: e leitura do que os numeros mostram.');

  const texto = linhas.join('\n');
  const pasta = path.join('estado', 'ads');
  fs.mkdirSync(pasta, { recursive: true });
  const base = path.join(pasta, 'analise-' + plataforma + '-' + new Date().toISOString().slice(0, 10));
  fs.writeFileSync(base + '.md', texto);
  console.log(texto);
  console.log('\nSalvo em ' + base + '.md');
}

function credenciais() {
  const mapa = [
    ['Google Ads', ['GOOGLE_ADS_DEVELOPER_TOKEN', 'GOOGLE_ADS_CUSTOMER_ID', 'GOOGLE_ADS_CLIENT_ID', 'GOOGLE_ADS_CLIENT_SECRET', 'GOOGLE_ADS_REFRESH_TOKEN']],
    ['TikTok Ads', ['TIKTOK_ADS_APP_ID', 'TIKTOK_ADS_SECRET', 'TIKTOK_ADS_ADVERTISER_ID']]
  ];
  console.log('Credenciais do trafego pago\n');
  mapa.forEach(([nome, vars]) => {
    const faltando = vars.filter(v => !process.env[v]);
    console.log(`${nome}: ${faltando.length === 0 ? 'completo, pode subir campanha' : 'falta ' + faltando.length + ' de ' + vars.length}`);
    faltando.forEach(v => console.log('   - ' + v));
  });
  console.log('\nSem credencial o agente entrega plano e CSV. Com credencial ele sobe e otimiza.');
}

if (cmd === 'plano') plano();
else if (cmd === 'analisar') analisar();
else if (cmd === 'credenciais') credenciais();
else console.log('Comandos: plano | analisar | credenciais\nEx: node src/ads.js plano --produto "Pacote IA" --orcamento 40 --cpa 60');
