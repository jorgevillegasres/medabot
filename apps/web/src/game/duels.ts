// Duelos de principios del Yunque (spec 2026-09-29 §2): la jerarquía se arma decidiendo
// qué gana cuando dos principios chocan. Es una inserción binaria sobre AXIS_KEYS, así que
// el resultado nunca tiene ciclos y bastan 8 a 11 duelos para ordenar los 6 principios.
import { AXIS_KEYS, type AxisKey } from '@medalab/content';

export type DuelState =
  | {
      /** [retador, ya ordenado] */ pair: [AxisKey, AxisKey];
      /** Número del duelo, desde 1. */ n: number;
    }
  | { rank: AxisKey[] };

/** Estado tras los duelos `outcomes` (true = gana el primero de la pareja). Sin estado propio. */
export function duelState(outcomes: readonly boolean[]): DuelState {
  const sorted: AxisKey[] = [AXIS_KEYS[0]];
  let used = 0;
  for (const item of AXIS_KEYS.slice(1)) {
    let lo = 0;
    let hi = sorted.length;
    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2);
      if (used === outcomes.length) return { pair: [item, sorted[mid]], n: used + 1 };
      if (outcomes[used++]) hi = mid;
      else lo = mid + 1;
    }
    sorted.splice(lo, 0, item);
  }
  return { rank: sorted };
}
