import { describe, expect, it } from 'vitest';
import { AXES, DILEMMAS } from '@medalab/content';
import { dominantAxis } from './reaction';

describe('dominantAxis', () => {
  const options = DILEMMAS.flatMap((d) => d.o);

  it('en las 90 opciones devuelve el primer eje de mayor peso', () => {
    expect(options).toHaveLength(90);
    for (const o of options) {
      const max = Math.max(...o.w);
      expect(dominantAxis(o)).toBe(AXES[o.w.indexOf(max)].k);
    }
  });

  it('en empate gana el primero en el orden S, O, H, P, A, L', () => {
    expect(dominantAxis({ w: [0, 3, 3, 0, 0, 0] })).toBe('O');
    expect(dominantAxis({ w: [2, 0, 0, 0, 0, 2] })).toBe('S');
    expect(dominantAxis({ w: [0, 0, 0, 0, 1, 1] })).toBe('A');
  });

  it('el contenido real tiene opciones con empate (el desempate importa)', () => {
    const tied = options.filter((o) => o.w.filter((x) => x === Math.max(...o.w)).length > 1);
    expect(tied.length).toBeGreaterThan(0);
  });
});
