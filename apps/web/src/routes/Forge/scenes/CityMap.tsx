import type { KeyboardEvent } from 'react';
import type { CircuitKey } from '@medalab/content';
import type { Draft } from '@medalab/engine';
import { robotSvg } from '@medalab/ui';
import { CORPORATION, DISTRICTS, MAP, PLAZA, placeOf, type Place } from '../../../game/city';
import type { CityState, PlaceStatus } from '../../../game/progress';
import { Building, Plaza, Tower } from './art/MapArt';

interface Props {
  state: CityState;
  /** Dónde está el robot. */
  at: CircuitKey;
  robot: Draft;
  onVisit: (key: CircuitKey) => void;
  onCorporation: () => void;
}

const pending = (n: number) => (n === 1 ? '1 encuentro pendiente' : `${n} encuentros pendientes`);

/** Un lugar tocable: botón accesible (teclado y lector de pantalla) dentro del SVG. */
function asButton(label: string, onActivate: () => void) {
  return {
    role: 'button' as const,
    tabIndex: 0,
    'aria-label': label,
    onClick: onActivate,
    onKeyDown: (e: KeyboardEvent<SVGGElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onActivate();
      }
    },
  };
}

export function CityMap({ state, at, robot, onVisit, onCorporation }: Props) {
  const home = state.district;
  const statusOf = (p: Place): PlaceStatus => (p.key === home.key ? home.status : 'locked');
  const labelOf = (p: Place) => {
    if (p.key !== home.key) return `Circuito ${p.name}: próximamente`;
    if (home.status === 'locked') return `Circuito ${p.name}: se abre al resolver la plaza`;
    return `Ir al circuito ${p.name}: ${pending(home.encounters.length - home.solved)}`;
  };
  const pos = placeOf(at);
  // El SVG del robot se incrusta dentro del mapa como un <svg> anidado de 40×40.
  const marker = robotSvg(robot).replace('<svg ', '<svg x="-20" y="-40" width="40" height="40" ');

  return (
    <svg
      className="city-map"
      viewBox={`0 0 ${MAP.width} ${MAP.height}`}
      role="group"
      aria-label="Mapa de Ciudad 2045"
    >
      {DISTRICTS.map((p) => (
        <line
          key={p.key}
          x1={PLAZA.x}
          y1={PLAZA.y}
          x2={p.x}
          y2={p.y}
          className={statusOf(p) === 'locked' ? 'street' : 'street open'}
        />
      ))}
      <line
        x1={PLAZA.x}
        y1={PLAZA.y}
        x2={CORPORATION.x}
        y2={CORPORATION.y}
        className={state.corporationOpen ? 'street open' : 'street'}
      />

      <g
        className="place"
        {...asButton(
          `Ir a la Plaza ${PLAZA.name}: ${pending(state.plaza.encounters.length - state.plaza.solved)}`,
          () => onVisit('core'),
        )}
      >
        <Plaza place={PLAZA} status={state.plaza.status} />
      </g>

      <g
        className={state.corporationOpen ? 'place open' : 'place locked'}
        {...asButton(
          state.corporationOpen
            ? `Ir a la ${CORPORATION.name}`
            : `${CORPORATION.name}: resuelve los ${state.total} encuentros`,
          onCorporation,
        )}
      >
        <Tower
          x={CORPORATION.x}
          y={CORPORATION.y}
          name={CORPORATION.name}
          open={state.corporationOpen}
        />
      </g>

      {DISTRICTS.map((p) => (
        <g
          key={p.key}
          className={statusOf(p) === 'locked' ? 'place locked' : 'place'}
          {...asButton(labelOf(p), () => onVisit(p.key))}
        >
          <Building place={p} status={statusOf(p)} />
        </g>
      ))}

      <g
        className="robot-marker"
        style={{ transform: `translate(${pos.x}px, ${pos.y - 10}px)` }}
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: marker }}
      />
    </svg>
  );
}
