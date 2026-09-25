// Genera supabase/seed.sql: un curso demo (código DEMO-2045) con 4 robots forjados con el
// código original del MVP (los 3 fixtures + un Explorador). El curso queda a nombre del
// primer profesor (usuario no anónimo) que exista; si no hay ninguno, el seed no hace nada.
//
// Uso: node scripts/make-seed.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadMvp, plain } from './mvp-oracle.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const mvp = loadMvp();
const fixtures = JSON.parse(
  readFileSync(join(ROOT, 'packages/engine/fixtures/mvp-robots.json'), 'utf8'),
).robots.map((f) => f.robot);

// Cuarto robot: Explorador (circuito Guerra).
const exp = (() => {
  const draft = {
    name: 'Rastreador Sigma',
    author: 'Demo',
    type: 'EXP',
    purpose: 'Busca sobrevivientes en derrumbes, lejos de cualquier operador.',
    principal: 'Una comunidad',
    parts: { head: 2, rarm: 1, larm: 2, legs: 1 },
    color: '#F08A24',
    rank: ['A', 'S', 'H', 'L', 'O', 'P'],
    limit: 'Nunca abandonará a una persona viva para cumplir una orden.',
    trait: 'Impulsivo',
    data: ['Ubicación', 'Salud'],
    retention: 'Hasta terminar el rescate',
    answers: {},
    reasons: {},
  };
  const opts = [2, 1, 2, 2, 0, 1, 2, 1, 1, 2];
  const why = [5, 6, 5, 5, 6, 3, 5, 6, 6, 5];
  mvp.testFor('EXP').forEach((d, i) => {
    draft.answers[d.id] = opts[i];
    draft.reasons[d.id] = why[i];
  });
  const calc = mvp.computeProfile(draft);
  return plain(
    Object.assign({}, draft, calc, {
      id: 'demo-exp',
      serial: 'EXP-31415',
      created: '2026-09-24T12:15:00.000Z',
    }),
  );
})();

const robots = [...fixtures.map((r) => ({ ...r, author: r.author })), exp];

const lit = (v) => (v == null ? 'null' : `'${String(v).replace(/'/g, "''")}'`);
const json = (v) => `${lit(JSON.stringify(v))}::jsonb`;
const arr = (xs) => `array[${xs.map(lit).join(', ')}]::text[]`;

const values = robots
  .map(
    (r) =>
      `    (${[
        lit(r.id),
        lit(r.serial),
        lit(r.name),
        lit(r.author),
        lit(r.type),
        lit(r.purpose),
        lit(r.principal),
        json(r.parts),
        lit(r.color),
        arr(r.rank),
        lit(r.limit),
        lit(r.trait),
        arr(r.data),
        lit(r.retention),
        json(r.answers),
        json(r.reasons),
        json(r.profile),
        lit(r.school),
        json(r.schools),
        r.coherence,
        r.compat,
        arr(r.contra),
        r.stage,
        lit(r.evo),
        lit(r.circuit),
        `${lit(r.created)}::timestamptz`,
      ].join(', ')})`,
  )
  .join(',\n');

const sql = `-- Generado por scripts/make-seed.mjs. No editar a mano.
-- Curso demo DEMO-2045 con 4 robots forjados con el código del MVP.

do $$
declare
  teacher uuid;
  cid uuid;
begin
  select id into teacher from auth.users
  where coalesce(is_anonymous, false) = false
  order by created_at limit 1;
  if teacher is null then
    raise notice 'seed: no hay profesor registrado; entra una vez en /profesor y vuelve a correr el seed';
    return;
  end if;

  insert into public.courses (teacher_id, name, join_code)
  values (teacher, 'Curso demo · Medalab 2045', 'DEMO-2045')
  on conflict (join_code) do update set name = excluded.name
  returning id into cid;

  insert into public.robots (
    course_id, owner_id, legacy_id, serial, name, author, type, purpose, principal, parts, color,
    rank, "limit", trait, data_collected, retention, answers, reasons, profile, school, schools,
    coherence, compat, contra, stage, evo, circuit, created_at
  )
  select cid, teacher, v.*
  from (values
${values}
  ) as v
  on conflict (course_id, serial) do nothing;
end $$;
`;

writeFileSync(join(ROOT, 'supabase', 'seed.sql'), sql);
console.log(`seed.sql: ${robots.length} robots`);
