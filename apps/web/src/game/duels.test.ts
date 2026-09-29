import { describe, expect, it } from 'vitest';
import { AXIS_KEYS, type AxisKey } from '@medalab/content';
import { duelState } from './duels';

function permutations<T>(xs: T[]): T[][] {
  if (xs.length <= 1) return [xs];
  return xs.flatMap((x, i) =>
    permutations([...xs.slice(0, i), ...xs.slice(i + 1)]).map((p) => [x, ...p]),
  );
}

/** Juega todos los duelos respondiendo según `target` (el que va antes en target gana). */
function play(target: AxisKey[]) {
  const outcomes: boolean[] = [];
  for (;;) {
    const s = duelState(outcomes);
    if ('rank' in s) return { rank: s.rank, duels: outcomes.length };
    const [a, b] = s.pair;
    outcomes.push(target.indexOf(a) < target.indexOf(b));
  }
}

describe('duelState', () => {
  it('empieza con un duelo entre los dos primeros principios', () => {
    const s = duelState([]);
    expect('pair' in s && s.pair).toEqual([AXIS_KEYS[1], AXIS_KEYS[0]]);
    expect('pair' in s && s.n).toBe(1);
  });

  it('recupera las 720 jerarquías posibles en 8 a 11 duelos', () => {
    const all = permutations(AXIS_KEYS);
    expect(all).toHaveLength(720);
    for (const target of all) {
      const { rank, duels } = play(target);
      expect(rank).toEqual(target);
      expect(duels).toBeGreaterThanOrEqual(8);
      expect(duels).toBeLessThanOrEqual(11);
    }
  });

  it('deshacer el último duelo devuelve el duelo anterior', () => {
    const before = duelState([true, false]);
    const after = duelState([true, false, true]);
    expect(after).not.toEqual(before);
    expect(duelState([true, false, true].slice(0, -1))).toEqual(before);
  });

  it('ignora resultados sobrantes', () => {
    const target = [...AXIS_KEYS].reverse();
    const { rank } = play(target);
    const outcomes: boolean[] = [];
    for (;;) {
      const s = duelState(outcomes);
      if ('rank' in s) break;
      outcomes.push(target.indexOf(s.pair[0]) < target.indexOf(s.pair[1]));
    }
    const s = duelState([...outcomes, true, false]);
    expect('rank' in s && s.rank).toEqual(rank);
  });
});
