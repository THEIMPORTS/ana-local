// Teste de instalação: valida contexto, memória, skills e o laço de ferramentas
// contra um servidor OpenAI falso, sem gastar nada.
import http from 'node:http';
import assert from 'node:assert';

process.env.OPENAI_API_KEY = 'teste-local';

// 1) servidor falso que simula a OpenAI: primeiro pede uma ferramenta, depois responde texto
let chamadas = 0;
const falso = http.createServer((req, res) => {
  let corpo = '';
  req.on('data', c => corpo += c);
  req.on('end', () => {
    const pedido = JSON.parse(corpo || '{}');
    chamadas++;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    if (chamadas === 1) {
      res.end(JSON.stringify({
        choices: [{ message: { role: 'assistant', content: '', tool_calls: [{ id: 'c1', type: 'function', function: { name: 'salvar_memoria', arguments: JSON.stringify({ texto: 'Dono gosta de café sem açúcar', categoria: 'Gosto' }) } }] } }],
        usage: { prompt_tokens: 100, completion_tokens: 20 }
      }));
    } else {
      res.end(JSON.stringify({
        choices: [{ message: { role: 'assistant', content: 'Guardei. Sou a Ana, pronta no seu terminal.' } }],
        usage: { prompt_tokens: 150, completion_tokens: 30 }
      }));
    }
  });
});

await new Promise(r => falso.listen(8799, r));
process.env.OPENAI_BASE_URL = 'http://127.0.0.1:8799/v1';

const { conversar, gasto, contextoBase } = await import('./brain.js');
const { totalMemorias, buscarMemorias } = await import('./memory.js');
const { indiceSkills } = await import('./skills.js');

const contexto = contextoBase('teste');
assert.ok(contexto.length > 50, 'contexto vazio');
console.log('contexto montado:', contexto.length, 'caracteres');
console.log('skills indexadas:', indiceSkills().length);
console.log('memórias antes:', totalMemorias());

const antes = totalMemorias();
const r = await conversar([], 'guarde que eu gosto de café sem açúcar');
assert.ok(r.texto.includes('Ana'), 'resposta inesperada: ' + r.texto);
assert.equal(totalMemorias(), antes + 1, 'memória não foi salva pela ferramenta');
const achou = buscarMemorias('café');
assert.ok(achou.length > 0, 'busca não encontrou a memória');
console.log('ferramenta executada e memória recuperável:', achou[0].texto);
console.log('gasto contabilizado:', JSON.stringify(gasto()));

falso.close();
console.log('\nTUDO OK: contexto, skills, memória e laço de ferramentas funcionando.');
