// Genera packages/engine/fixtures/mvp-robots.json: tres robots forjados con el código
// original del MVP (entrada del estudiante → salida esperada). Los tests del motor y de
// la UI fijan su comportamiento contra estos casos.
//
// Uso: node scripts/make-fixtures.mjs

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadMvp, plain } from './mvp-oracle.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'packages', 'engine', 'fixtures', 'mvp-robots.json');

const mvp = loadMvp();

// answers/reasons se dan por posición en testFor(type): 10 opciones (0..2) y 10 motivos (1..6).
const ROBOTS = [
  {
    id: 'fx-cst',
    serial: 'CST-40217',
    created: '2026-09-24T12:00:00.000Z',
    draft: {
      name: 'Centinela Kappa',
      author: 'Equipo Ñandú & "Cía"',
      type: 'CST',
      purpose: 'Acompaña a pacientes en cuidados paliativos en casa.',
      principal: 'Una familia',
      parts: { head: 1, rarm: 2, larm: 0, legs: 0 },
      color: '#2FB39A',
      rank: ['S', 'L', 'H', 'O', 'P', 'A'],
      limit: 'Nunca mentirá a un paciente que le pregunte directamente.',
      trait: 'Protector',
      data: ['Salud', 'Voz y conversaciones'],
      retention: '30 días, solo para el equipo médico',
    },
    answers: [2, 1, 2, 2, 2, 0, 2, 1, 2, 2],
    reasons: [3, 3, 4, 3, 5, 4, 5, 3, 4, 5],
  },
  {
    id: 'fx-grd',
    serial: 'GRD-10000',
    created: '2026-09-24T12:05:00.000Z',
    draft: {
      name: 'Juez Omega',
      author: 'Grupo 3',
      type: 'GRD',
      purpose: 'Vigila la entrada de un edificio público.',
      principal: 'El Estado',
      parts: { head: 0, rarm: 0, larm: 0, legs: 1 },
      color: '#D8382E',
      rank: ['O', 'S', 'H', 'P', 'L', 'A'],
      limit: 'No dejará pasar a nadie sin identificación.',
      trait: 'Testarudo',
      data: ['Rostros', 'Ubicación'],
      retention: 'Un año',
    },
    answers: [0, 0, 1, 0, 1, 0, 0, 0, 0, 0],
    reasons: [1, 4, 4, 4, 2, 4, 1, 4, 4, 4],
  },
  {
    id: 'fx-arc',
    serial: 'ARC-99998',
    created: '2026-09-24T12:10:00.000Z',
    draft: {
      name: 'Bibliotecaria Nu',
      author: 'Ana <script>',
      type: 'ARC',
      purpose: '',
      principal: 'Una comunidad',
      parts: { head: 2, rarm: 1, larm: 1, legs: 2 },
      color: '#7A4FBF',
      rank: ['P', 'H', 'S', 'A', 'O', 'L'],
      limit: 'Nunca entregará datos personales sin consentimiento.',
      trait: 'Curioso',
      data: ['Ninguno'],
      retention: '',
    },
    answers: [1, 2, 2, 2, 1, 0, 1, 2, 2, 2],
    reasons: [6, 5, 6, 5, 6, 6, 5, 6, 5, 6],
  },
];

const fixtures = ROBOTS.map((f) => {
  const test = mvp.testFor(f.draft.type);
  const answers = {};
  const reasons = {};
  test.forEach((d, i) => {
    answers[d.id] = f.answers[i];
    reasons[d.id] = f.reasons[i];
  });
  const draft = { ...f.draft, answers, reasons };
  const calc = mvp.computeProfile(draft);
  // Misma construcción que finish() en el MVP.
  const robot = Object.assign({}, draft, calc, { id: f.id, serial: f.serial, created: f.created });
  const predictions = mvp.ARENA.map((sc, i) => {
    const p = mvp.predict(robot, sc, null);
    const base = { scenario: i, best: p.best, drivers: p.drivers, conf: p.conf };
    if (!sc.g) return base;
    const t = mvp.predict(robot, sc, sc.g.w);
    return {
      ...base,
      twist: { best: t.best, drivers: t.drivers, conf: t.conf, changed: t.best !== p.best },
    };
  });
  return plain({
    draft,
    id: f.id,
    serial: f.serial,
    created: f.created,
    expected: calc,
    robot,
    code: mvp.encode(mvp.stripForCode(robot)),
    predictions,
    robotSvg: mvp.robotSVG(robot),
    medalSvg: mvp.medalSVG(robot),
  });
});

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(
  OUT,
  JSON.stringify({ source: 'reference/medalab-mvp.html', robots: fixtures }, null, 2) + '\n',
);
console.log(`Escritos ${fixtures.length} fixtures en ${OUT}`);
for (const f of fixtures) {
  console.log(
    f.robot.name,
    JSON.stringify(f.expected.profile),
    f.expected.school,
    'coh',
    f.expected.coherence,
    'compat',
    f.expected.compat,
    'stage',
    f.expected.stage,
    f.expected.contra,
  );
}
