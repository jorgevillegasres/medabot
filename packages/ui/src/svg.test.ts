import { describe, expect, it } from 'vitest';
import { loadMvp } from '../../../scripts/mvp-oracle.mjs';
import fixtures from '../../engine/fixtures/mvp-robots.json';
import { medalSvg, robotSvg } from './svg';

const mvp = loadMvp();

describe('Medalla idéntica a la del MVP', () => {
  it.each(fixtures.robots.map((f) => [f.robot.name, f] as const))('fixture %s', (_, f) => {
    expect(medalSvg(f.robot)).toBe(f.medalSvg);
  });

  it('medalla con perfiles extremos, sin compat y valores por defecto', () => {
    const cases = [
      {
        name: 'Cero',
        serial: 'CST-10000',
        color: '#2B67C2',
        profile: { S: 20, O: 20, H: 20, P: 20, A: 20, L: 20 },
      },
      {
        name: 'Tope',
        serial: 'EXP-99998',
        color: '#F08A24',
        profile: { S: 100, O: 100, H: 100, P: 100, A: 100, L: 100 },
        compat: 100,
      },
      {
        name: 'Metabee',
        serial: 'KBT-11220',
        color: '#F5C518',
        profile: { S: 78, O: 28, H: 70, P: 45, A: 92, L: 85 },
        compat: 81,
      },
      {},
    ];
    for (const r of cases) expect(medalSvg(r)).toBe(mvp.medalSVG(r));
  });
});

describe('saneamiento de códigos importados', () => {
  const evil = '"/><img src=x onerror=alert(1)>';

  it('color, serie y compatibilidad maliciosos no inyectan marcado', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r: any = { name: evil, color: evil, serial: evil, compat: evil };
    for (const svg of [medalSvg(r), robotSvg(r)]) {
      // El nombre aparece escapado como texto; lo que no puede aparecer es una etiqueta real.
      expect(svg).not.toContain('<img');
      expect(svg).not.toMatch(/="[^"]*"\/>\s*<img/);
      expect(svg).toContain('&lt;img');
    }
    expect(medalSvg(r)).toContain('???-00000');
  });
});
