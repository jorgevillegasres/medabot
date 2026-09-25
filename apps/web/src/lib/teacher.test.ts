import { describe, expect, it } from 'vitest';
import type { Robot } from '@medalab/engine';
import fixtures from '../../../../packages/engine/fixtures/mvp-robots.json';
import { csvCell, groupStats, robotsToCsv } from './teacher';

const robots = fixtures.robots.map((f) => f.robot) as unknown as Robot[];

describe('groupStats', () => {
  it('agrega escuelas, niveles, promedios, ejes y contradicciones', () => {
    const s = groupStats(robots);
    expect(s.total).toBe(3);
    expect(s.schools).toEqual({ U: 1, D: 1, V: 0, C: 1 });
    // etapas 3.9, 3.2, 5.6 → niveles 4, 3, 6
    expect(s.stages).toEqual({ 1: 0, 2: 0, 3: 1, 4: 1, 5: 0, 6: 1 });
    expect(s.avgCoherence).toBe(Math.round(((66 + 94 + 89) / 3) * 10) / 10);
    expect(s.axes[0].avg).toBeGreaterThanOrEqual(s.axes[5].avg);
    expect(s.axes.map((a) => a.k).sort()).toEqual(['A', 'H', 'L', 'O', 'P', 'S']);
    expect(s.withContra.map((r) => r.name)).toEqual(['Centinela Kappa']);
  });

  it('grupo vacío', () => {
    const s = groupStats([]);
    expect(s.total).toBe(0);
    expect(s.avgCoherence).toBeNull();
  });
});

describe('CSV', () => {
  it('escapa comillas, comas y saltos de línea', () => {
    expect(csvCell('a,b')).toBe('"a,b"');
    expect(csvCell('dijo "no"')).toBe('"dijo ""no"""');
    expect(csvCell('x\ny')).toBe('"x\ny"');
    expect(csvCell(null)).toBe('');
  });

  it('neutraliza fórmulas', () => {
    expect(csvCell('=HYPERLINK("x")')).toBe(`"'=HYPERLINK(""x"")"`);
    expect(csvCell('+57 300')).toBe("'+57 300");
    expect(csvCell('@SUM')).toBe("'@SUM");
  });

  it('una fila por robot, con BOM y nombre técnico de la escuela', () => {
    const csv = robotsToCsv(robots);
    expect(csv.startsWith('﻿serie,nombre,')).toBe(true);
    const lines = csv.trim().split('\r\n');
    expect(lines).toHaveLength(4);
    expect(lines[1]).toContain('Del cuidado');
    expect(lines[1]).toContain('"Equipo Ñandú & ""Cía"""');
  });
});
