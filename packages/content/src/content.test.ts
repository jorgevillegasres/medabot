import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { buildAll } from '../../../scripts/extract-content.mjs';
import {
  ARENA,
  AXES,
  AXIS_KEYS,
  CATALOGS,
  CIRCUITS,
  DILEMMAS,
  REASONS,
  SCHOOLS,
  STAGE_NAMES,
  TYPES,
  TYPE_CIRCUIT,
  getDilemma,
  getScenario,
  testFor,
} from './index';

const SCHOOL_KEYS = ['U', 'D', 'V', 'C'];

const isWeights = (w: unknown) =>
  Array.isArray(w) && w.length === 6 && w.every((x) => Number.isInteger(x) && x >= 0 && x <= 3);

describe('los JSON son idénticos a lo que se extrae del MVP', () => {
  const expected = buildAll();
  for (const [path, text] of Object.entries(expected)) {
    it(path.replace(/.*[\\/](packages|docs)[\\/]/, '$1/'), () => {
      expect(readFileSync(path, 'utf8')).toBe(text);
    });
  }
});

describe('integridad del contenido', () => {
  it('6 ejes en el orden S,O,H,P,A,L', () => {
    expect(AXIS_KEYS).toEqual(['S', 'O', 'H', 'P', 'A', 'L']);
    expect(AXES).toHaveLength(6);
  });

  it('30 dilemas con ids únicos', () => {
    expect(DILEMMAS).toHaveLength(30);
    expect(new Set(DILEMMAS.map((d) => d.id)).size).toBe(30);
  });

  it('12 escenarios de Arena', () => {
    expect(ARENA).toHaveLength(12);
    expect(new Set(ARENA.map((s) => s.t)).size).toBe(12);
  });

  it.each(DILEMMAS.map((d) => [d.id, d] as const))(
    'dilema %s: circuito válido, 3 opciones, pesos 6×(0–3), escuela válida',
    (_, d) => {
      expect(Object.keys(CIRCUITS)).toContain(d.c);
      expect(d.o).toHaveLength(3);
      for (const o of d.o) {
        expect(isWeights(o.w), JSON.stringify(o.w)).toBe(true);
        expect(SCHOOL_KEYS).toContain(o.sc);
      }
    },
  );

  it.each(ARENA.map((s, i) => [i, s.t, s] as const))(
    'escenario %i (%s): 3 opciones, pesos 6×(0–3), escuela válida, giro 3×6',
    (_, __, s) => {
      expect(Object.keys(CIRCUITS)).toContain(s.c);
      expect(s.o).toHaveLength(3);
      for (const o of s.o) {
        expect(isWeights(o.w), JSON.stringify(o.w)).toBe(true);
        expect(SCHOOL_KEYS).toContain(o.sc);
      }
      if (s.g) {
        expect(s.g.x.length).toBeGreaterThan(0);
        expect(s.g.w).toHaveLength(3);
        for (const w of s.g.w) expect(isWeights(w), JSON.stringify(w)).toBe(true);
      }
    },
  );

  it('7 tipos, cada uno con 2 ejes de compatibilidad válidos y un circuito', () => {
    expect(TYPES).toHaveLength(7);
    for (const t of TYPES) {
      expect(t.fit).toHaveLength(2);
      for (const k of t.fit) expect(AXIS_KEYS).toContain(k);
      expect(Object.keys(CIRCUITS)).toContain(TYPE_CIRCUIT[t.c]);
    }
  });

  it('4 escuelas U, D, V, C con nombre técnico y temperamento', () => {
    expect(Object.keys(SCHOOLS)).toEqual(SCHOOL_KEYS);
    for (const s of Object.values(SCHOOLS)) {
      expect(s.n).toBeTruthy();
      expect(s.t).toBeTruthy();
    }
  });

  it('6 motivos, uno por etapa de Kohlberg, cada uno con nombre de etapa', () => {
    expect(REASONS.map((r) => r.s)).toEqual([1, 2, 3, 4, 5, 6]);
    for (const r of REASONS) expect(STAGE_NAMES[r.s]).toBeTruthy();
  });

  it('catálogos de la forja completos', () => {
    expect(Object.keys(CATALOGS.parts)).toEqual(['head', 'rarm', 'larm', 'legs']);
    for (const p of Object.values(CATALOGS.parts)) expect(p.opts).toHaveLength(3);
    expect(CATALOGS.colors.length).toBeGreaterThan(0);
    expect(CATALOGS.principals.length).toBeGreaterThan(0);
  });
});

describe('testFor', () => {
  it.each(TYPES.map((t) => [t.c] as const))(
    '%s produce 10 dilemas: 6 core → 4 del circuito',
    (code) => {
      const list = testFor(code);
      expect(list).toHaveLength(10);
      expect(list.slice(0, 6).every((d) => d.c === 'core')).toBe(true);
      expect(list.slice(6).every((d) => d.c === TYPE_CIRCUIT[code])).toBe(true);
      // conserva el orden de aparición en dilemmas.json
      const idx = list.map((d) => DILEMMAS.indexOf(d));
      expect(idx).toEqual([...idx].sort((a, b) => a - b));
    },
  );

  it('cada circuito no core tiene exactamente 4 dilemas', () => {
    for (const c of Object.keys(CIRCUITS).filter((c) => c !== 'core')) {
      expect(
        DILEMMAS.filter((d) => d.c === c),
        c,
      ).toHaveLength(4);
    }
    expect(DILEMMAS.filter((d) => d.c === 'core')).toHaveLength(6);
  });
});

describe('consultas', () => {
  it('getDilemma y getScenario', () => {
    expect(getDilemma('hija')?.t).toBe('La hija que no es hija');
    expect(getDilemma('no-existe')).toBeUndefined();
    expect(getScenario(0)?.t).toBe('El cuerpo prestado');
    expect(getScenario(99)).toBeUndefined();
  });
});
