// Qué lugares de la ciudad están abiertos y qué encuentros están resueltos (spec §2, Acto 3).
// Se deriva del borrador: el juego no guarda respuestas propias.
import { CIRCUITS, circuitFor, testFor, type CircuitKey, type Dilemma } from '@medalab/content';
import type { Draft } from '@medalab/engine';

export type PlaceStatus = 'locked' | 'open' | 'done';

export interface EncounterState {
  dilemma: Dilemma;
  /** Posición en testFor(type): 0..9. */
  index: number;
  solved: boolean;
}

export interface PlaceState {
  key: CircuitKey;
  status: PlaceStatus;
  encounters: EncounterState[];
  solved: number;
}

export interface CityState {
  plaza: PlaceState;
  /** El distrito del circuito del tipo de robot. */
  district: PlaceState;
  /** Los otros cinco distritos: siempre cerrados en esta fase. */
  closed: CircuitKey[];
  solved: number;
  total: number;
  corporationOpen: boolean;
}

type DraftAnswers = Pick<Draft, 'type' | 'answers' | 'reasons'>;

/** Resuelto = opción y motivo elegidos (igual que la forja clásica). */
export const isSolved = (d: Pick<Draft, 'answers' | 'reasons'>, id: string) =>
  d.answers[id] != null && d.reasons[id] != null;

export function cityState(d: DraftAnswers): CityState {
  const home = circuitFor(d.type);
  const all = testFor(d.type).map((dilemma, index) => ({
    dilemma,
    index,
    solved: isSolved(d, dilemma.id),
  }));
  const at = (key: CircuitKey) => {
    const encounters = all.filter((e) => e.dilemma.c === key);
    const n = encounters.filter((e) => e.solved).length;
    return { key, encounters, solved: n, complete: n === encounters.length };
  };

  const p = at('core');
  const h = at(home);
  const plaza: PlaceState = { ...strip(p), status: p.complete ? 'done' : 'open' };
  const district: PlaceState = {
    ...strip(h),
    status: !p.complete ? 'locked' : h.complete ? 'done' : 'open',
  };
  const solved = all.filter((e) => e.solved).length;
  return {
    plaza,
    district,
    closed: (Object.keys(CIRCUITS) as CircuitKey[]).filter((k) => k !== 'core' && k !== home),
    solved,
    total: all.length,
    corporationOpen: solved === all.length,
  };
}

function strip(x: { key: CircuitKey; encounters: EncounterState[]; solved: number }) {
  return { key: x.key, encounters: x.encounters, solved: x.solved };
}
