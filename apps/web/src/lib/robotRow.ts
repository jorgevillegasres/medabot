// Conversión Robot (forma del MVP / packages/engine) ↔ fila de la tabla robots.

import type { AxisKey, CircuitKey, PartKey, SchoolKey } from '@medalab/content';
import { EVOLUTIONS, type Profile, type Robot } from '@medalab/engine';

export interface RobotRow {
  id: string;
  course_id: string;
  owner_id: string;
  legacy_id: string | null;
  serial: string;
  name: string;
  author: string;
  type: string;
  purpose: string | null;
  principal: string | null;
  parts: Record<PartKey, number>;
  color: string;
  rank: AxisKey[];
  limit: string;
  trait: string | null;
  data_collected: string[];
  retention: string | null;
  answers: Record<string, number>;
  reasons: Record<string, number>;
  profile: Profile;
  school: SchoolKey;
  schools: Record<SchoolKey, number>;
  coherence: number;
  compat: number;
  contra: string[];
  stage: number | string | null;
  evo: string | null;
  circuit: CircuitKey;
  created_at: string;
  updated_at?: string;
}

export type RobotInsert = Omit<RobotRow, 'id' | 'owner_id' | 'created_at' | 'updated_at'> & {
  id?: string;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Fila a insertar. Los ids no-UUID (robots del MVP) se guardan en legacy_id. */
export function robotToInsert(r: Robot, courseId: string): RobotInsert {
  const isUuid = UUID_RE.test(r.id);
  return {
    ...(isUuid ? { id: r.id } : {}),
    course_id: courseId,
    legacy_id: isUuid ? null : r.id,
    serial: r.serial,
    name: r.name,
    author: r.author ?? '',
    type: r.type,
    purpose: r.purpose ?? '',
    principal: r.principal ?? null,
    parts: r.parts,
    color: r.color,
    rank: r.rank,
    limit: r.limit,
    trait: r.trait ?? null,
    data_collected: r.data ?? [],
    retention: r.retention ?? '',
    answers: r.answers,
    reasons: r.reasons,
    profile: r.profile,
    school: r.school,
    schools: r.schools,
    coherence: r.coherence,
    compat: r.compat,
    contra: r.contra ?? [],
    stage: r.stage,
    evo: r.evo,
    circuit: r.circuit,
  };
}

/** Robot con la misma forma (y orden de claves) que produce la forja del MVP. */
export function rowToRobot(row: RobotRow): Robot {
  const stage = row.stage == null ? 0 : Number(row.stage);
  const evo = EVOLUTIONS.find((e) => e.n === row.evo) ?? EVOLUTIONS.find((e) => stage < e.max)!;
  return {
    name: row.name,
    author: row.author,
    type: row.type,
    purpose: row.purpose ?? '',
    principal: row.principal ?? '',
    parts: row.parts,
    color: row.color,
    rank: row.rank,
    limit: row.limit,
    trait: row.trait ?? '',
    data: row.data_collected ?? [],
    retention: row.retention ?? '',
    answers: row.answers,
    reasons: row.reasons,
    profile: row.profile,
    school: row.school,
    schools: row.schools,
    coherence: row.coherence,
    compat: row.compat,
    contra: row.contra ?? [],
    stage,
    evo: row.evo ?? evo.n,
    evoDesc: evo.d,
    circuit: row.circuit,
    id: row.legacy_id ?? row.id,
    serial: row.serial,
    created: row.created_at,
  };
}

/** Campos que un estudiante puede editar de su robot publicado. */
export const EDITABLE = ['name', 'purpose', 'limit', 'retention'] as const;
