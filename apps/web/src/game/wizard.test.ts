import { describe, expect, it } from 'vitest';
import { TYPES, circuitFor, testFor } from '@medalab/content';
import { citySteps, firstOpenStep, firstPendingStep } from './wizard';

describe('citySteps', () => {
  it.each(TYPES.map((t) => t.c))('tipo %s: consigna, 6 de la plaza, aviso, 4 del circuito, revisión', (type) => {
    const steps = citySteps(type);
    const ids = testFor(type).map((d) => d.id);
    expect(steps.map((s) => s.kind)).toEqual([
      'intro',
      ...ids.slice(0, 6).flatMap(() => ['decide', 'reason']),
      'unlock',
      ...ids.slice(6).flatMap(() => ['decide', 'reason']),
      'review',
    ]);
    const decided = steps.flatMap((s) => (s.kind === 'decide' ? [s.dilemma.id] : []));
    expect(decided).toEqual(ids);
    const unlock = steps.find((s) => s.kind === 'unlock');
    expect(unlock && unlock.kind === 'unlock' && unlock.circuit).toBe(circuitFor(type));
  });
});

describe('firstOpenStep', () => {
  const type = 'MDR';
  const steps = citySteps(type);
  const ids = testFor(type).map((d) => d.id);
  const solved = (n: number) => ({
    type,
    answers: Object.fromEntries(ids.slice(0, n).map((id) => [id, 0])),
    reasons: Object.fromEntries(ids.slice(0, n).map((id) => [id, 1])),
  });

  it('sin respuestas: la consigna', () => {
    expect(firstOpenStep(solved(0))).toBe(0);
  });

  it('a mitad: la decisión del primer dilema pendiente', () => {
    const i = firstOpenStep(solved(3));
    expect(steps[i]).toMatchObject({ kind: 'decide', dilemma: { id: ids[3] } });
  });

  it('con decisión pero sin motivo: el paso del motivo', () => {
    const d = solved(3);
    d.answers[ids[3]] = 2;
    expect(steps[firstOpenStep(d)]).toMatchObject({ kind: 'reason', dilemma: { id: ids[3] } });
  });

  it('todo resuelto: la revisión', () => {
    expect(steps[firstOpenStep(solved(10))].kind).toBe('review');
  });

  it('sin respuestas se puede avanzar hasta la primera decisión', () => {
    expect(steps[firstPendingStep(solved(0))]).toMatchObject({
      kind: 'decide',
      dilemma: { id: ids[0] },
    });
  });
});
