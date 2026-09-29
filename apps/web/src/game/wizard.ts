// Secuencia de pasos de la Ciudad como asistente (spec 2026-09-29 §3).
// Se deriva del tipo de robot; las respuestas siguen viviendo en el borrador.
import { circuitFor, testFor, type CircuitKey, type Dilemma } from '@medalab/content';
import type { Draft } from '@medalab/engine';

export type CityStep =
  | { kind: 'intro' }
  | { kind: 'decide'; dilemma: Dilemma; /** Posición en testFor(type): 0..9. */ index: number }
  | { kind: 'reason'; dilemma: Dilemma; index: number }
  | { kind: 'unlock'; circuit: CircuitKey }
  | { kind: 'review' };

/** Consigna, los 6 dilemas de la plaza, aviso del circuito, sus 4 dilemas y la revisión. */
export function citySteps(type: string): CityStep[] {
  const steps: CityStep[] = [{ kind: 'intro' }];
  let unlocked = false;
  testFor(type).forEach((dilemma, index) => {
    if (dilemma.c !== 'core' && !unlocked) {
      steps.push({ kind: 'unlock', circuit: circuitFor(type) });
      unlocked = true;
    }
    steps.push({ kind: 'decide', dilemma, index }, { kind: 'reason', dilemma, index });
  });
  steps.push({ kind: 'review' });
  return steps;
}

type Answers = Pick<Draft, 'type' | 'answers' | 'reasons'>;

/** El paso más lejano al que se puede llegar: el primero sin responder, o la revisión. */
export function firstPendingStep(d: Answers): number {
  const steps = citySteps(d.type);
  const i = steps.findIndex(
    (s) =>
      (s.kind === 'decide' && d.answers[s.dilemma.id] == null) ||
      (s.kind === 'reason' && d.reasons[s.dilemma.id] == null),
  );
  return i === -1 ? steps.length - 1 : i;
}

/** Dónde retomar: la consigna si no hay respuestas; si no, el primer paso sin responder. */
export function firstOpenStep(d: Answers): number {
  return Object.keys(d.answers).length > 0 ? firstPendingStep(d) : 0;
}
