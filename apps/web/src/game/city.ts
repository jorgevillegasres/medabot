// Lugares de Ciudad 2045. Nombres y descripciones salen de CIRCUITS (sin texto nuevo);
// aquí solo se decide dónde va cada lugar en el plano y de qué color es.
import { CIRCUITS, TYPES, TYPE_CIRCUIT, type CircuitKey } from '@medalab/content';

export interface Place {
  key: CircuitKey;
  name: string;
  description: string;
  /** Nombres de los tipos de robot cuyo circuito es este. */
  types: string[];
  x: number;
  y: number;
  color: string;
}

/** Tamaño del plano (unidades del viewBox SVG). Vertical, pensado para celular. */
export const MAP = { width: 360, height: 470 } as const;

const LAYOUT: Record<CircuitKey, { x: number; y: number; color: string }> = {
  core: { x: 180, y: 250, color: '#F5C518' },
  cuerpo: { x: 60, y: 150, color: '#2FB39A' },
  umbral: { x: 300, y: 150, color: '#9AA3AD' },
  estado: { x: 50, y: 290, color: '#2B67C2' },
  ciencia: { x: 310, y: 290, color: '#7A4FBF' },
  guerra: { x: 95, y: 395, color: '#D8382E' },
  vinculos: { x: 265, y: 395, color: '#F08A24' },
};

const makePlace = (key: CircuitKey): Place => ({
  key,
  name: CIRCUITS[key].n,
  description: CIRCUITS[key].d,
  types: TYPES.filter((t) => TYPE_CIRCUIT[t.c] === key).map((t) => t.n),
  ...LAYOUT[key],
});

export const PLAZA = makePlace('core');
export const DISTRICTS: Place[] = (Object.keys(CIRCUITS) as CircuitKey[])
  .filter((k) => k !== 'core')
  .map(makePlace);

/** Destino final: allí se graba la medalla. El nombre aparece en los dilemas del MVP. */
export const CORPORATION = { x: 180, y: 50, name: 'Corporación Medabot' } as const;

export function placeOf(key: CircuitKey): Place {
  return key === 'core' ? PLAZA : DISTRICTS.find((p) => p.key === key)!;
}
