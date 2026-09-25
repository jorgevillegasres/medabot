// Extrae el contenido del MVP (reference/medalab-mvp.html) a packages/content/*.json
// y genera docs/contenido.md. El contenido nunca se copia a mano: se evalúa el bloque
// de datos del HTML tal cual está.
//
// Uso: node scripts/extract-content.mjs          (escribe los archivos)
//      node scripts/extract-content.mjs --check  (falla si los archivos no coinciden)

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import vm from 'node:vm';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const HTML_PATH = join(ROOT, 'reference', 'medalab-mvp.html');
const CONTENT_DIR = join(ROOT, 'packages', 'content');
const DOC_PATH = join(ROOT, 'docs', 'contenido.md');

const START = '/* ===== DATOS ===== */';
const END = '/* ===== ESTADO ===== */';

/** Evalúa el bloque de datos del HTML y devuelve las constantes. */
export function extract(html) {
  const a = html.indexOf(START);
  const b = html.indexOf(END);
  if (a < 0 || b < 0 || b < a) throw new Error('No se encontró el bloque de datos en el HTML');
  const code =
    html.slice(a, b) +
    '\n;({AXES,TYPES,PRINCIPALS,TRAITS,DATA,COLORS,PARTS,SCHOOLS,CIRCUITS,TYPE_CIRCUIT,REASONS,STAGE_NAMES,DILEMAS,ARENA})';
  return vm.runInNewContext(code, {}, { filename: 'medalab-mvp.html#datos' });
}

/** JSON con indentación, pero arrays de primitivos en una sola línea (pesos legibles). */
export function stringify(value, indent = '') {
  const next = indent + '  ';
  if (Array.isArray(value)) {
    if (value.every((v) => v === null || typeof v !== 'object')) {
      return '[' + value.map((v) => JSON.stringify(v)).join(', ') + ']';
    }
    return '[\n' + value.map((v) => next + stringify(v, next)).join(',\n') + '\n' + indent + ']';
  }
  if (value && typeof value === 'object') {
    const entries = Object.entries(value);
    if (!entries.length) return '{}';
    return (
      '{\n' +
      entries.map(([k, v]) => next + JSON.stringify(k) + ': ' + stringify(v, next)).join(',\n') +
      '\n' +
      indent +
      '}'
    );
  }
  return JSON.stringify(value);
}

/** Mapa archivo → contenido de texto, a partir de las constantes extraídas. */
export function render(c) {
  const files = {
    'axes.json': c.AXES,
    'types.json': c.TYPES,
    'circuits.json': { circuits: c.CIRCUITS, typeCircuit: c.TYPE_CIRCUIT },
    'reasons.json': { reasons: c.REASONS, stageNames: c.STAGE_NAMES },
    'schools.json': c.SCHOOLS,
    'dilemmas.json': c.DILEMAS,
    'arena.json': c.ARENA,
    'catalogs.json': {
      principals: c.PRINCIPALS,
      traits: c.TRAITS,
      data: c.DATA,
      colors: c.COLORS,
      parts: c.PARTS,
    },
  };
  const out = {};
  for (const [name, value] of Object.entries(files)) out[name] = stringify(value) + '\n';
  return out;
}

const cell = (s) => String(s).replace(/\|/g, '\\|');

/** docs/contenido.md: tabla de dilemas y escenarios con su circuito y fuente. */
export function renderDoc(c) {
  const circ = (k) => c.CIRCUITS[k];
  const types = (k) =>
    c.TYPES.filter((t) => c.TYPE_CIRCUIT[t.c] === k)
      .map((t) => t.n)
      .join(', ') || (k === 'core' ? 'Todos' : '—');
  const lines = [
    '# Contenido de Medalab 2045',
    '',
    '> Generado automáticamente por `pnpm content:extract` a partir de `reference/medalab-mvp.html`. No editar a mano.',
    '',
    '## Circuitos',
    '',
    '| Clave | Circuito | Fuente | Tipos |',
    '|---|---|---|---|',
    ...Object.keys(c.CIRCUITS).map(
      (k) => `| ${k} | ${cell(circ(k).n)} | ${cell(circ(k).d)} | ${cell(types(k))} |`,
    ),
    '',
    `## Dilemas (${c.DILEMAS.length})`,
    '',
    '| # | id | Circuito | Título |',
    '|---|---|---|---|',
    ...c.DILEMAS.map((d, i) => `| ${i + 1} | ${d.id} | ${cell(circ(d.c).n)} | ${cell(d.t)} |`),
    '',
    `## Escenarios de Arena (${c.ARENA.length})`,
    '',
    '| Índice | Circuito | Título | Giro |',
    '|---|---|---|---|',
    ...c.ARENA.map(
      (s, i) => `| ${i} | ${cell(circ(s.c).n)} | ${cell(s.t)} | ${s.g ? cell(s.g.x) : '—'} |`,
    ),
    '',
  ];
  return lines.join('\n');
}

export function buildAll(html = readFileSync(HTML_PATH, 'utf8')) {
  const c = extract(html);
  const files = {};
  for (const [name, text] of Object.entries(render(c))) files[join(CONTENT_DIR, name)] = text;
  files[DOC_PATH] = renderDoc(c);
  return files;
}

function main() {
  const check = process.argv.includes('--check');
  const files = buildAll();
  const stale = [];
  for (const [path, text] of Object.entries(files)) {
    if (check) {
      let current = null;
      try {
        current = readFileSync(path, 'utf8');
      } catch {
        /* no existe */
      }
      if (current !== text) stale.push(path);
    } else {
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, text);
    }
  }
  if (check && stale.length) {
    console.error('Contenido desactualizado o editado a mano:\n' + stale.join('\n'));
    process.exit(1);
  }
  console.log(check ? 'Contenido al día.' : `Escritos ${Object.keys(files).length} archivos.`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) main();
