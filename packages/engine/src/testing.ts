// Utilidades para tests: borradores aleatorios reproducibles.

import { AXIS_KEYS, CATALOGS, TYPES, testFor } from '@medalab/content';
import type { Draft } from './types';

/** PRNG determinista (mulberry32). */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Borrador completo (o parcial si partial=true) con respuestas al azar. */
export function randomDraft(rand: () => number, partial = false): Draft {
  const pick = <T>(xs: readonly T[]) => xs[Math.floor(rand() * xs.length)];
  const type = pick(TYPES).c;
  const rank = [...AXIS_KEYS];
  for (let i = rank.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [rank[i], rank[j]] = [rank[j], rank[i]];
  }
  const answers: Record<string, number> = {};
  const reasons: Record<string, number> = {};
  for (const d of testFor(type)) {
    if (partial && rand() < 0.3) continue;
    answers[d.id] = Math.floor(rand() * 3);
    if (!partial || rand() < 0.8) reasons[d.id] = 1 + Math.floor(rand() * 6);
  }
  return {
    name: 'R' + Math.floor(rand() * 1e6),
    author: 'Test',
    type,
    purpose: '',
    principal: pick(CATALOGS.principals),
    parts: {
      head: Math.floor(rand() * 3),
      rarm: Math.floor(rand() * 3),
      larm: Math.floor(rand() * 3),
      legs: Math.floor(rand() * 3),
    },
    color: pick(CATALOGS.colors),
    rank,
    limit: 'x',
    trait: pick(CATALOGS.traits),
    data: [],
    retention: '',
    answers,
    reasons,
  };
}
