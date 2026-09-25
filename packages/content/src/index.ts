// Contenido del curso, extraído de reference/medalab-mvp.html por scripts/extract-content.mjs.
// Los JSON no se editan a mano: este módulo solo los tipa y expone consultas.

import axesJson from '../axes.json';
import typesJson from '../types.json';
import circuitsJson from '../circuits.json';
import reasonsJson from '../reasons.json';
import schoolsJson from '../schools.json';
import dilemmasJson from '../dilemmas.json';
import arenaJson from '../arena.json';
import catalogsJson from '../catalogs.json';

export type AxisKey = 'S' | 'O' | 'H' | 'P' | 'A' | 'L';
export type SchoolKey = 'U' | 'D' | 'V' | 'C';
export type CircuitKey =
  'core' | 'cuerpo' | 'umbral' | 'estado' | 'ciencia' | 'guerra' | 'vinculos';
/** Pesos en el orden S, O, H, P, A, L. */
export type Weights = number[];

export interface Axis {
  k: AxisKey;
  /** Nombre visible. */
  n: string;
  /** Descripción. */
  d: string;
}

export interface RobotType {
  /** Código, p. ej. 'CST'. */
  c: string;
  n: string;
  d: string;
  /** Los dos ejes con los que el tipo rinde mejor. */
  fit: AxisKey[];
}

export interface Circuit {
  n: string;
  d: string;
}

export interface Reason {
  /** Etapa de Kohlberg 1..6. */
  s: number;
  x: string;
}

export interface School {
  /** Nombre técnico (solo profesor). */
  n: string;
  /** Temperamento (lo que ve el estudiante). */
  t: string;
  d: string;
}

export interface Option {
  x: string;
  w: Weights;
  sc: SchoolKey;
}

export interface Dilemma {
  id: string;
  c: CircuitKey;
  t: string;
  s: string;
  o: Option[];
}

export interface Twist {
  x: string;
  /** Un vector de pesos alternativo por opción. */
  w: Weights[];
}

export interface Scenario {
  c: CircuitKey;
  t: string;
  s: string;
  o: Option[];
  g?: Twist;
}

export interface PartCatalog {
  n: string;
  opts: string[];
}

export type PartKey = 'head' | 'rarm' | 'larm' | 'legs';

export interface Catalogs {
  principals: string[];
  traits: string[];
  data: string[];
  colors: string[];
  parts: Record<PartKey, PartCatalog>;
}

export const AXES = axesJson as Axis[];
export const TYPES = typesJson as RobotType[];
export const CIRCUITS = circuitsJson.circuits as Record<CircuitKey, Circuit>;
export const TYPE_CIRCUIT = circuitsJson.typeCircuit as Record<string, CircuitKey>;
export const REASONS = reasonsJson.reasons as Reason[];
export const STAGE_NAMES = reasonsJson.stageNames as Record<string, string>;
export const SCHOOLS = schoolsJson as Record<SchoolKey, School>;
export const DILEMMAS = dilemmasJson as Dilemma[];
export const ARENA = arenaJson as Scenario[];
export const CATALOGS = catalogsJson as Catalogs;

export const AXIS_KEYS: AxisKey[] = AXES.map((a) => a.k);

export function getType(code: string): RobotType | undefined {
  return TYPES.find((t) => t.c === code);
}

/** Circuito del tipo; 'vinculos' si el tipo no está mapeado (comportamiento del MVP). */
export function circuitFor(type: string): CircuitKey {
  return TYPE_CIRCUIT[type] ?? 'vinculos';
}

/** Los 6 dilemas 'core' seguidos de los 4 del circuito del tipo, en orden de aparición. */
export function testFor(type: string): Dilemma[] {
  const c = circuitFor(type);
  return DILEMMAS.filter((d) => d.c === 'core').concat(DILEMMAS.filter((d) => d.c === c));
}

export function getDilemma(id: string): Dilemma | undefined {
  return DILEMMAS.find((d) => d.id === id);
}

/** Escenario por índice en arena.json (es la clave que se guarda en bouts.scenario_id). */
export function getScenario(idx: number): Scenario | undefined {
  return ARENA[idx];
}
