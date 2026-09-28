import { describe, expect, it } from 'vitest';
import { CIRCUITS, DILEMMAS, TYPES, TYPE_CIRCUIT } from '@medalab/content';
import { CORPORATION, DISTRICTS, MAP, PLAZA, placeOf } from './city';

describe('mapa de Ciudad 2045', () => {
  it('seis distritos, uno por circuito no común, con nombre y descripción del contenido', () => {
    expect(DISTRICTS.map((d) => d.key)).toEqual(Object.keys(CIRCUITS).filter((k) => k !== 'core'));
    for (const p of [PLAZA, ...DISTRICTS]) {
      expect(p.name).toBe(CIRCUITS[p.key].n);
      expect(p.description).toBe(CIRCUITS[p.key].d);
    }
    expect(PLAZA.key).toBe('core');
  });

  it('cada tipo de robot aparece en el distrito de su circuito', () => {
    for (const t of TYPES) expect(placeOf(TYPE_CIRCUIT[t.c]).types).toContain(t.n);
  });

  it('el nombre de la Corporación sale del contenido, no se inventa', () => {
    expect(JSON.stringify(DILEMMAS)).toContain(CORPORATION.name);
  });

  it('los lugares caben en el mapa y no se superponen', () => {
    const all = [PLAZA, ...DISTRICTS, CORPORATION];
    for (const p of all) {
      expect(p.x).toBeGreaterThanOrEqual(40);
      expect(p.x).toBeLessThanOrEqual(MAP.width - 40);
      expect(p.y).toBeGreaterThanOrEqual(40);
      expect(p.y).toBeLessThanOrEqual(MAP.height - 50);
    }
    for (const a of all)
      for (const b of all)
        if (a !== b) expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(80);
  });
});
