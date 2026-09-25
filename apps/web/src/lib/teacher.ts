// Agregados del grupo y exportación CSV para el panel del profesor.

import {
  AXES,
  CIRCUITS,
  SCHOOLS,
  STAGE_NAMES,
  getType,
  type AxisKey,
  type SchoolKey,
} from '@medalab/content';
import type { Robot } from '@medalab/engine';

export interface GroupStats {
  total: number;
  schools: Record<SchoolKey, number>;
  /** Nivel de Kohlberg redondeado (1..6) → cantidad. */
  stages: Record<number, number>;
  avgCoherence: number | null;
  avgCompat: number | null;
  /** Ejes ordenados de más a menos valorado (promedio del perfil). */
  axes: { k: AxisKey; n: string; avg: number }[];
  withContra: Robot[];
}

const round1 = (x: number) => Math.round(x * 10) / 10;

export function groupStats(robots: Robot[]): GroupStats {
  const n = robots.length;
  const schools: Record<SchoolKey, number> = { U: 0, D: 0, V: 0, C: 0 };
  const stages: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  for (const r of robots) {
    if (r.school in schools) schools[r.school]++;
    const s = Math.round(r.stage);
    if (s >= 1 && s <= 6) stages[s]++;
  }
  const avg = (f: (r: Robot) => number) =>
    n ? round1(robots.reduce((a, r) => a + f(r), 0) / n) : null;
  const axes = AXES.map((a) => ({
    k: a.k,
    n: a.n,
    avg: avg((r) => r.profile[a.k] ?? 0) ?? 0,
  })).sort((a, b) => b.avg - a.avg);
  return {
    total: n,
    schools,
    stages,
    avgCoherence: avg((r) => r.coherence),
    avgCompat: avg((r) => r.compat),
    axes,
    withContra: robots.filter((r) => r.contra?.length),
  };
}

/** Celda CSV: comillas escapadas y sin fórmulas (Excel ejecuta celdas que empiezan por =,+,-,@). */
export function csvCell(v: unknown): string {
  let s = v == null ? '' : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return /[",;\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function robotsToCsv(robots: Robot[]): string {
  const head = [
    'serie',
    'nombre',
    'autor',
    'tipo',
    'escuela',
    'temperamento',
    'coherencia',
    'compatibilidad',
    'etapa_kohlberg',
    'nivel',
    'evolucion',
    'circuito',
    'contradiccion',
    'jerarquia_declarada',
    ...AXES.map((a) => `perfil_${a.k}`),
    'limite',
    'proposito',
    'creado',
  ];
  const rows = robots.map((r) => [
    r.serial,
    r.name,
    r.author,
    getType(r.type)?.n ?? r.type,
    SCHOOLS[r.school]?.n ?? r.school,
    SCHOOLS[r.school]?.t ?? '',
    r.coherence,
    r.compat,
    r.stage,
    STAGE_NAMES[Math.round(r.stage)] ?? '',
    r.evo,
    CIRCUITS[r.circuit]?.n ?? r.circuit,
    (r.contra ?? []).join(' y '),
    r.rank.join(' > '),
    ...AXES.map((a) => r.profile[a.k]),
    r.limit,
    r.purpose,
    r.created,
  ]);
  // BOM para que Excel abra bien las tildes.
  return '﻿' + [head, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
}
