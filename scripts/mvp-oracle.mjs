// Oráculo del MVP: evalúa las funciones originales de reference/medalab-mvp.html
// (datos, computeProfile, predict, encode/decode, robotSVG, medalSVG) sin DOM.
// Los tests del motor y de la UI se comparan contra este código, no contra una copia.

import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const HTML_PATH = join(ROOT, 'reference', 'medalab-mvp.html');

export function loadMvp(html = readFileSync(HTML_PATH, 'utf8')) {
  const slice = (from, to) => {
    const i = html.indexOf(from);
    const j = html.indexOf(to, i);
    if (i < 0 || j < 0) throw new Error(`No se encontró el bloque ${from} … ${to} en el MVP`);
    return html.slice(i, j);
  };
  const line = (re) => {
    const m = html.match(re);
    if (!m) throw new Error(`No se encontró ${re} en el MVP`);
    return m[0];
  };
  const code = [
    slice('/* ===== DATOS ===== */', '/* ===== ESTADO ===== */'),
    slice('/* ===== ROBOT SVG ===== */', '/* ===== UTIL ===== */'),
    line(/^function esc\(.*$/m),
    line(/^function encode\(.*$/m),
    line(/^function decode\(.*$/m),
    slice('/* ===== CÁLCULO DEL PERFIL ===== */', 'function finish(){'),
    line(/^function stripForCode\(.*$/m),
    slice('function predict(', 'function fight(){'),
    ';({AXES,TYPES,DILEMAS,ARENA,COLORS,testFor,computeProfile,predict,encode,decode,stripForCode,robotSVG,medalSVG})',
  ].join('\n');
  const sandbox = { btoa, atob, escape, unescape, encodeURIComponent, decodeURIComponent };
  return vm.runInNewContext(code, sandbox, { filename: 'medalab-mvp.html' });
}

/** Copia sin prototipos del otro contexto de vm, para comparar con toEqual. */
export const plain = (x) => (x === undefined ? undefined : JSON.parse(JSON.stringify(x)));
