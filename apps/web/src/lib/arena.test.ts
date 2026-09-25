import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ARENA } from '@medalab/content';
import type { Robot } from '@medalab/engine';
import { HTML_PATH, loadMvp, plain } from '../../../../scripts/mvp-oracle.mjs';
import fixtures from '../../../../packages/engine/fixtures/mvp-robots.json';
import {
  CHANGED,
  NOT_CHANGED,
  REFEREE,
  nextStatus,
  refereeFor,
  resultFor,
  tallies,
  verdictReason,
  voters,
  votingPhase,
  type BoutStatus,
} from './arena';

const html = readFileSync(HTML_PATH, 'utf8');
const mvp = loadMvp();
const [a, b] = fixtures.robots.map((f) => f.robot) as unknown as Robot[];

describe('textos del Sr. Referí y veredictos: idénticos al MVP', () => {
  it.each(Object.entries(REFEREE))('%s', (_, text) => expect(html).toContain(text));
  it('veredicto y cambio de decisión', () => {
    expect(html).toContain(
      'Porque en su medalla pesan más ${p.drivers[0]} y ${p.drivers[1]}. Certeza: ${p.conf}%.',
    );
    expect(html).toContain(CHANGED);
    expect(html).toContain(NOT_CHANGED);
    expect(verdictReason({ drivers: ['x', 'y'], conf: 42 })).toBe(
      'Porque en su medalla pesan más x y y. Certeza: 42%.',
    );
  });
});

describe('flujo de estados', () => {
  it('con giro: open → revealed → twisted → twist_revealed → closed', () => {
    const seen: BoutStatus[] = ['open'];
    let s: BoutStatus | null = 'open';
    while ((s = nextStatus(s, true))) seen.push(s);
    expect(seen).toEqual(['open', 'revealed', 'twisted', 'twist_revealed', 'closed']);
  });
  it('sin giro: open → revealed → closed', () => {
    expect(nextStatus('revealed', false)).toBe('closed');
  });
  it('solo se vota en open (antes) y twisted (después del giro)', () => {
    expect(votingPhase('open')).toBe('before');
    expect(votingPhase('twisted')).toBe('after_twist');
    for (const s of ['revealed', 'twist_revealed', 'closed'] as const)
      expect(votingPhase(s)).toBeNull();
  });
});

describe('resultado guardado', () => {
  const withTwist = ARENA.findIndex((s) => s.g);
  const scenario = ARENA[withTwist];
  const counts = tallies([
    { phase: 'before', side: 'A', option_idx: 1, votes: 3 },
    { phase: 'before', side: 'B', option_idx: 2, votes: 2 },
    { phase: 'after_twist', side: 'A', option_idx: 0, votes: 4 },
  ]);

  it('tallies', () => {
    expect(counts.before).toEqual({ A: [0, 3, 0], B: [0, 0, 2] });
    expect(voters(counts.before)).toBe(3);
  });

  it('las predicciones guardadas coinciden con el predict del MVP, con y sin giro', () => {
    const r1 = resultFor('revealed', null, { a, b, scenario, counts });
    const r2 = resultFor('twist_revealed', r1, { a, b, scenario, counts });
    for (const [side, robot] of [
      ['A', a],
      ['B', b],
    ] as const) {
      const orig = plain(mvp.predict(robot, scenario, null));
      const tw = plain(mvp.predict(robot, scenario, scenario.g!.w));
      expect(r2.before!.predictions[side]).toEqual({
        best: orig.best,
        drivers: orig.drivers,
        conf: orig.conf,
      });
      expect(r2.after_twist!.predictions[side]).toEqual({
        best: tw.best,
        drivers: tw.drivers,
        conf: tw.conf,
        changed: tw.best !== orig.best,
      });
    }
    expect(r2.before!.votes).toEqual(counts.before);
    expect(r2.after_twist!.votes).toEqual(counts.after_twist);
    // No se guarda la escuela (los estudiantes pueden leer bouts).
    expect(JSON.stringify(r2)).not.toMatch(/"school"/);
  });

  it('el Sr. Referí elige el mensaje según las decisiones', () => {
    const r = resultFor('revealed', null, { a, b, scenario, counts });
    const same = r.before!.predictions.A.best === r.before!.predictions.B.best;
    expect(refereeFor('revealed', r)).toBe(same ? REFEREE.same : REFEREE.different);
    expect(refereeFor('twist_revealed', r)).toBe(REFEREE.twist);
    expect(refereeFor('open', null)).toBeNull();
  });
});
