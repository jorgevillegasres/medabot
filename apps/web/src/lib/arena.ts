// Lógica pura de la Arena: estados de la robatalla, resultado guardado y conteo de votos.
// Los textos del Sr. Referí y de los veredictos son los del MVP (arena.test.ts lo verifica).

import { type Scenario } from '@medalab/content';
import { predict, type Contender, type Prediction } from '@medalab/engine';

export type BoutStatus = 'open' | 'revealed' | 'twisted' | 'twist_revealed' | 'closed';
export type Side = 'A' | 'B';
export type Phase = 'before' | 'after_twist';

export const REFEREE = {
  same: 'ambos robots decidieron lo mismo por razones distintas. Pregunta para la clase: ¿es la misma decisión?',
  different:
    'dos medallas, dos caminos. Pregunta para la clase: ¿cuál de los dos querrían tener cerca? ¿Y existe una tercera salida que ninguno vio?',
  twist:
    'un solo dato cambió. Si la decisión cambió, ¿qué principio se activó? Si no cambió, ¿es firmeza o ceguera?',
  before: 'Antes de revelar: que cada diseñador diga en voz alta qué haría su robot.',
} as const;

export const verdictReason = (p: Pick<SavedPrediction, 'drivers' | 'conf'>) =>
  `Porque en su medalla pesan más ${p.drivers[0]} y ${p.drivers[1]}. Certeza: ${p.conf}%.`;
export const CHANGED = 'Cambió de decisión.';
export const NOT_CHANGED = 'No cambió de decisión.';

/** Lo que se guarda por robot (sin la escuela: los estudiantes pueden leer bouts). */
export interface SavedPrediction {
  best: number;
  drivers: string[];
  conf: number;
}

export type Tally = Record<Side, [number, number, number]>;

export interface BoutResult {
  before?: { predictions: Record<Side, SavedPrediction>; votes: Tally };
  after_twist?: {
    predictions: Record<Side, SavedPrediction & { changed: boolean }>;
    votes: Tally;
  };
}

const save = (p: Prediction): SavedPrediction => ({
  best: p.best,
  drivers: p.drivers,
  conf: p.conf,
});

/** Predicciones de ambos robots en una fase (con los pesos del giro en after_twist). */
export function phasePredictions(a: Contender, b: Contender, sc: Scenario, phase: Phase) {
  const alt = phase === 'after_twist' ? sc.g?.w : null;
  return { A: save(predict(a, sc, alt)), B: save(predict(b, sc, alt)) };
}

export function emptyTally(): Tally {
  return { A: [0, 0, 0], B: [0, 0, 0] };
}

export interface VoteCountRow {
  phase: Phase;
  side: Side;
  option_idx: number;
  votes: number;
}

export function tallies(rows: VoteCountRow[]): Record<Phase, Tally> {
  const t = { before: emptyTally(), after_twist: emptyTally() };
  for (const r of rows) {
    if (t[r.phase]?.[r.side] && r.option_idx >= 0 && r.option_idx <= 2) {
      t[r.phase][r.side][r.option_idx] += r.votes;
    }
  }
  return t;
}

/** Siguiente estado tras revelar/girar/cerrar. null = no hay más pasos. */
export function nextStatus(status: BoutStatus, hasTwist: boolean): BoutStatus | null {
  switch (status) {
    case 'open':
      return 'revealed';
    case 'revealed':
      return hasTwist ? 'twisted' : 'closed';
    case 'twisted':
      return 'twist_revealed';
    case 'twist_revealed':
      return 'closed';
    case 'closed':
      return null;
  }
}

/** Resultado a guardar al pasar a `next` (se agrega al resultado previo). */
export function resultFor(
  next: BoutStatus,
  prev: BoutResult | null,
  ctx: { a: Contender; b: Contender; scenario: Scenario; counts: Record<Phase, Tally> },
): BoutResult {
  const r: BoutResult = { ...(prev ?? {}) };
  if (next === 'revealed') {
    r.before = {
      predictions: phasePredictions(ctx.a, ctx.b, ctx.scenario, 'before'),
      votes: ctx.counts.before,
    };
  }
  if (next === 'twist_revealed') {
    const before = phasePredictions(ctx.a, ctx.b, ctx.scenario, 'before');
    const after = phasePredictions(ctx.a, ctx.b, ctx.scenario, 'after_twist');
    r.after_twist = {
      predictions: {
        A: { ...after.A, changed: after.A.best !== before.A.best },
        B: { ...after.B, changed: after.B.best !== before.B.best },
      },
      votes: ctx.counts.after_twist,
    };
  }
  return r;
}

/** Fase de votación abierta según el estado (null = no se vota). */
export function votingPhase(status: BoutStatus): Phase | null {
  return status === 'open' ? 'before' : status === 'twisted' ? 'after_twist' : null;
}

/** Mensaje del Sr. Referí para lo que se está mostrando. */
export function refereeFor(status: BoutStatus, result: BoutResult | null): string | null {
  if (status === 'twist_revealed') return REFEREE.twist;
  if ((status === 'revealed' || status === 'twisted') && result?.before) {
    const p = result.before.predictions;
    return p.A.best === p.B.best ? REFEREE.same : REFEREE.different;
  }
  return null;
}

/** Cuántas personas votaron en una fase (cada una vota por A y por B). */
export const voters = (t: Tally) => Math.max(sum(t.A), sum(t.B));
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
