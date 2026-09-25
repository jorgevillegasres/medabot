import type { AxisKey, CircuitKey, PartKey, SchoolKey } from '@medalab/content';

/** Lo que el estudiante llena en la forja (mismas claves y orden que newDraft() del MVP). */
export interface Draft {
  name: string;
  author: string;
  type: string;
  purpose: string;
  principal: string;
  parts: Record<PartKey, number>;
  color: string;
  rank: AxisKey[];
  limit: string;
  trait: string;
  /** Datos que recoge. */
  data: string[];
  retention: string;
  /** dilemmaId → índice de opción (0..2). */
  answers: Record<string, number>;
  /** dilemmaId → etapa de Kohlberg (1..6). */
  reasons: Record<string, number>;
}

export type Profile = Record<AxisKey, number>;

export interface ProfileResult {
  profile: Profile;
  school: SchoolKey;
  schools: Record<SchoolKey, number>;
  coherence: number;
  compat: number;
  /** Nombres de los ejes declarados arriba (1º-2º) que el test dejó abajo (4º-6º). */
  contra: string[];
  stage: number;
  evo: string;
  evoDesc: string;
  circuit: CircuitKey;
}

export interface RobotMeta {
  id: string;
  serial: string;
  created: string;
}

export type Robot = Draft & ProfileResult & RobotMeta;
