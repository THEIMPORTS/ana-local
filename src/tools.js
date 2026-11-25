// Ferramentas que a Ana pode usar no computador do dono.
import fs from 'node:fs';
import path from 'node:path';
import { exec } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { salvarMemoria, buscarMemorias } from './memory.js';
import { lerSkill } from './skills.js';

const RAIZ = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const AREA = process.env.ANA_AREA || path.join(RAIZ, 'projetos');
const PERMITIR_COMANDO = (process.env.ANA_PERMITIR_COMANDO || 'sim') === 'sim';

function dentroDaArea(p) {
  const alvo = path.resolve(AREA, p);
  if (!alvo.startsWith(path.resolve(AREA))) throw new Error('Caminho fora da pasta de projetos: ' + p);
  return alvo;
}

export const ferramentas = [
  { type: 'function', function: { name: 'listar_arquivos', description: 'Lista arquivos de uma pasta dentro de projetos', parameters: { type: 'object', properties: { pasta: { type: 'string' } }, required: [] } } },
  { type: 'function', function: { name: 'ler_arquivo', description: 'Lê um arquivo de texto dentro de projetos', parameters: { type: 'object', properties: { caminho: { type: 'string' } }, required: ['caminho'] } } },
  { type: 'function', function: { name: 'escrever_arquivo', description: 'Cria ou sobrescreve um arquivo dentro de projetos', parameters: { type: 'object', properties: { caminho: { type: 'string' }, conteudo: { type: 'string' } }, required: ['caminho', 'conteudo'] } } },
  { type: 'function', function: { name: 'executar_comando', description: 'Executa um comando de terminal e devolve a saída', parameters: { type: 'object', properties: { comando: { type: 'string' } }, required: ['comando'] } } },
  { type: 'function', function: { name: 'salvar_memoria', description: 'Guarda um fato permanente sobre o dono ou o negócio', parameters: { type: 'object', properties: { texto: { type: 'string' }, categoria: { type: 'string' } }, required: ['texto'] } } },
  { type: 'function', function: { name: 'buscar_memoria', description: 'Procura nas memórias já salvas', parameters: { type: 'object', properties: { consulta: { type: 'string' } }, required: ['consulta'] } } },
  { type: 'function', function: { name: 'ler_skill', description: 'Abre o conteúdo de uma skill pelo nome', parameters: { type: 'object', properties: { nome: { type: 'string' } }, required: ['nome'] } } },
  { type: 'function', function: { name: 'buscar_web', description: 'Busca uma página na internet e devolve o texto', parameters: { type: 'object', properties: { url: { type: 'string' } }, required: ['url'] } } }
];

export async function executarFerramenta(nome, args) {
  switch (nome) {
    case 'listar_arquivos': {
      const pasta = dentroDaArea(args.pasta || '.');
      if (!fs.existsSync(pasta)) return 'Pasta não existe ainda.';
      return fs.readdirSync(pasta, { withFileTypes: true })
        .map(d => (d.isDirectory() ? '[pasta] ' : '') + d.name).join('\n') || 'Pasta vazia.';
    }
    case 'ler_arquivo': {
      const alvo = dentroDaArea(args.caminho);
      if (!fs.existsSync(alvo)) return 'Arquivo não encontrado.';
      return fs.readFileSync(alvo, 'utf8').slice(0, 20000);
    }
    case 'escrever_arquivo': {
      const alvo = dentroDaArea(args.caminho);
      fs.mkdirSync(path.dirname(alvo), { recursive: true });
      fs.writeFileSync(alvo, args.conteudo || '');
      return 'Arquivo salvo: ' + args.caminho;
    }
    case 'executar_comando': {
      if (!PERMITIR_COMANDO) return 'Comandos desativados por configuração (ANA_PERMITIR_COMANDO=nao).';
      return await new Promise(resolve => {
        exec(args.comando || '', { cwd: fs.existsSync(AREA) ? AREA : RAIZ, timeout: 120000, maxBuffer: 1024 * 1024 },
          (erro, saida, erroSaida) => resolve([saida, erroSaida, erro ? 'erro: ' + erro.message : ''].filter(Boolean).join('\n').slice(0, 8000) || 'sem saída'));
      });
    }
    case 'salvar_memoria': return JSON.stringify(salvarMemoria(args.texto, args.categoria || 'Geral'));
    case 'buscar_memoria': return buscarMemorias(args.consulta, 10).map(m => '- ' + m.texto).join('\n') || 'Nada encontrado.';
    case 'ler_skill': return lerSkill(args.nome);
    case 'buscar_web': {
      const r = await fetch(args.url, { headers: { 'User-Agent': 'Mozilla/5.0 AnaLocal' } });
      const html = await r.text();
      return html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 8000);
    }
    default: return 'Ferramenta desconhecida: ' + nome;
  }
}
