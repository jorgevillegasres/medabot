// Motor de perfil. Reproduce computeProfile() del MVP (PLAN.md §5.2–5.6) operación por
// operación; los tests lo comparan contra el código original.

import { AXES, TYPES, circuitFor, testFor, type AxisKey, type SchoolKey } from '@medalab/content';
import type { Draft, Profile, ProfileResult, Robot, RobotMeta } from './types';

/** Evolución de la medalla por etapa media de Kohlberg (textos del MVP). */
export const EVOLUTIONS = [
  { max: 2.5, n: 'Medalla novata', d: 'Decide pensando en castigos y beneficios.' },
  {
    max: 4.5,
    n: 'Medalla social',
    d: 'Decide por lo que se espera de ella y por lo que manda la regla.',
  },
  {
    max: Infinity,
    n: 'Medalla de principios',
    d: 'Decide por acuerdos y principios que valdrían para cualquiera.',
  },
] as const;

export type ProfileInput = Pick<Draft, 'type' | 'rank' | 'answers' | 'reasons'>;

export function computeProfile(d: ProfileInput): ProfileResult {
  const list = testFor(d.type);
  const sum = [0, 0, 0, 0, 0, 0];
  const max = [0, 0, 0, 0, 0, 0];
  const sc: Record<SchoolKey, number> = { U: 0, D: 0, V: 0, C: 0 };
  const stages: number[] = [];
  for (const dl of list) {
    const a = d.answers[dl.id];
    const o = a == null ? undefined : dl.o[a];
    // Como en el MVP: los dilemas sin responder no cuentan ni en la suma ni en el máximo.
    if (!o) continue;
    o.w.forEach((w, k) => (sum[k] += w));
    sc[o.sc]++;
    if (d.reasons && d.reasons[dl.id]) stages.push(d.reasons[dl.id]);
    for (let k = 0; k < 6; k++) max[k] += Math.max(...dl.o.map((x) => x.w[k]));
  }

  const profile = {} as Profile;
  AXES.forEach((a, k) => (profile[a.k] = Math.round(20 + (80 * sum[k]) / (max[k] || 1))));

  // Sort estable: en empate gana la primera en el orden U, D, V, C.
  const school = Object.entries(sc).sort((a, b) => b[1] - a[1])[0][0] as SchoolKey;

  const declared = {} as Record<AxisKey, number>;
  d.rank.forEach((k, i) => (declared[k] = i + 1));
  const observed = {} as Record<AxisKey, number>;
  [...AXES].sort((a, b) => profile[b.k] - profile[a.k]).forEach((a, i) => (observed[a.k] = i + 1));

  let ssd = 0;
  AXES.forEach((a) => (ssd += Math.pow(declared[a.k] - observed[a.k], 2)));
  const rho = 1 - (6 * ssd) / (6 * 35);
  const coherence = Math.round(((rho + 1) / 2) * 100);

  const type = TYPES.find((t) => t.c === d.type);
  if (!type) throw new Error(`Tipo de robot desconocido: ${d.type}`);
  const compat = Math.round((profile[type.fit[0]] + profile[type.fit[1]]) / 2);

  const contra = AXES.filter((a) => declared[a.k] <= 2 && observed[a.k] >= 4).map((a) => a.n);

  const stage = stages.length
    ? Math.round((stages.reduce((a, b) => a + b, 0) / stages.length) * 10) / 10
    : 0;
  const evo = EVOLUTIONS.find((e) => stage < e.max)!;

  return {
    profile,
    school,
    schools: sc,
    coherence,
    compat,
    contra,
    stage,
    evo: evo.n,
    evoDesc: evo.d,
    circuit: circuitFor(d.type),
  };
}

/** Graba la medalla: mismo objeto (y mismo orden de claves) que finish() en el MVP. */
export function forgeRobot(draft: Draft, meta: RobotMeta): Robot {
  return Object.assign({}, draft, computeProfile(draft), meta);
}

/** Ejes ordenados por peso observado, de mayor a menor (empates: orden de AXES). */
export function axesByWeight(profile: Profile) {
  return [...AXES].sort((a, b) => profile[b.k] - profile[a.k]);
}
