// Skills: lê as pastas de .agents/skills (ou skills/ local) e expõe nome + descrição.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function candidatos() {
  return [
    path.join(RAIZ, 'skills'),
    path.join(RAIZ, '.agents', 'skills'),
    path.join(process.env.HOME || '', '.ana', 'skills')
  ].filter(p => fs.existsSync(p));
}

let cache = null;

export function indiceSkills() {
  if (cache) return cache;
  const lista = [];
  for (const dir of candidatos()) {
    for (const nome of fs.readdirSync(dir)) {
      const pasta = path.join(dir, nome);
      if (!fs.statSync(pasta).isDirectory()) continue;
      const arq = path.join(pasta, 'SKILL.md');
      if (!fs.existsSync(arq)) continue;
      const texto = fs.readFileSync(arq, 'utf8');
      const desc = (texto.match(/^description:\s*(.+)$/m) || [])[1] || '';
      lista.push({ nome, descricao: desc.slice(0, 160), caminho: arq });
    }
  }
  cache = lista;
  return lista;
}

export function lerSkill(nome) {
  const item = indiceSkills().find(s => s.nome === nome || s.nome === String(nome).replace(/\.md$/, ''));
  if (!item) return 'Skill não encontrada. Disponíveis: ' + indiceSkills().slice(0, 30).map(s => s.nome).join(', ');
  const texto = fs.readFileSync(item.caminho, 'utf8');
  return texto.slice(0, 8000);
}
