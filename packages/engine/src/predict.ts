// Predicción en la Arena. Reproduce predict() del MVP (PLAN.md §5.8).

import { AXES, type Option, type Scenario, type SchoolKey, type Weights } from '@medalab/content';
import type { Profile } from './types';

export interface Contender {
  profile: Profile;
  school: SchoolKey;
}

export interface Prediction {
  /** Índice de la opción elegida. */
  best: number;
  option: Option;
  /** Los dos ejes que más empujaron la decisión, en minúscula. */
  drivers: string[];
  /** Certeza 0–100. */
  conf: number;
}

/** alt: pesos alternativos por opción (el giro g.w); null/undefined = pesos originales. */
export function predict(r: Contender, sc: Scenario, alt?: Weights[] | null): Prediction {
  const p = r.profile;
  const scores = sc.o.map((o, i) => {
    const w = alt ? alt[i] : o.w;
    let s = 0;
    w.forEach((x, k) => (s += x * p[AXES[k].k]));
    if (o.sc === r.school) s *= 1.15;
    return s;
  });
  const best = scores.indexOf(Math.max(...scores));
  const option = sc.o[best];
  const w = alt ? alt[best] : option.w;
  const drivers = w
    .map((x, k) => ({ w: x * p[AXES[k].k], n: AXES[k].n }))
    .sort((a, b) => b.w - a.w)
    .slice(0, 2)
    .map((d) => d.n.toLowerCase());
  const margin = [...scores].sort((a, b) => b - a);
  const conf = margin[1] ? Math.round((100 * (margin[0] - margin[1])) / margin[0]) : 100;
  return { best, option, drivers, conf };
}

export interface BoutPrediction {
  original: Prediction;
  /** Solo si el escenario tiene giro. */
  twisted?: Prediction & { changed: boolean };
}

/** Predicción con y sin giro para un robot. */
export function predictBout(r: Contender, sc: Scenario): BoutPrediction {
  const original = predict(r, sc);
  if (!sc.g) return { original };
  const t = predict(r, sc, sc.g.w);
  return { original, twisted: { ...t, changed: t.best !== original.best } };
}
