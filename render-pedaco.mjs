// Roda NA NUVEM (GitHub Actions): renderiza a parte <i> de <partes> da lista de micro-cenas (trabalhos.json), com o bundle já montado.
// node render-pedaco.mjs <i> <partes>   ->  saida/<nome>.mp4
import { readFileSync, mkdirSync } from 'node:fs';
import { cpus } from 'node:os';
import { basename, resolve } from 'node:path';
import { renderMedia, selectComposition } from '@remotion/renderer';

const [i, partes] = process.argv.slice(2).map(Number);
const todos = JSON.parse(readFileSync('trabalhos.json', 'utf8'));
// divide pelo tamanho (quadros), não pela contagem: cada máquina pega uma carga parecida
const ordem = todos.map((t, k) => ({ t, k, q: t.props.ficha.duracao })).sort((a, b) => b.q - a.q);
const carga = Array(partes).fill(0), meu = [];
for (const o of ordem) { const m = carga.indexOf(Math.min(...carga)); carga[m] += o.q; if (m === i) meu.push(o.t); }
mkdirSync('saida', { recursive: true });
const serveUrl = resolve('bundle'), opts = { headless: true, gl: 'swangle' };
for (const t of meu) {
  const t0 = Date.now();
  const composition = await selectComposition({ serveUrl, id: t.composicao, inputProps: t.props, chromiumOptions: opts });
  await renderMedia({ composition, serveUrl, inputProps: t.props, codec: 'h264', outputLocation: resolve('saida', basename(t.saida)),
    scale: t.escala ?? 1, pixelFormat: 'yuv420p', concurrency: cpus().length, logLevel: 'error', chromiumOptions: opts });
  console.log(`${basename(t.saida)}: ${t.props.ficha.duracao} quadros em ${((Date.now() - t0) / 1000).toFixed(0)} s`);
}
console.log(`parte ${i}: ${meu.length} cenas`);
