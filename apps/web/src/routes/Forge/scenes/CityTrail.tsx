import { RobotSvg } from '@medalab/ui';
import type { Draft } from '@medalab/engine';
import { placeOf } from '../../../game/city';
import type { CityState } from '../../../game/progress';

/** Recorrido de la ciudad: 6 puntos de la plaza y 4 del circuito, con el robot en el actual. */
export function CityTrail({
  city,
  current,
  robot,
}: {
  city: CityState;
  /** Posición del dilema actual (0..9), o null fuera de un dilema. */
  current: number | null;
  robot: Draft;
}) {
  const groups = [city.plaza, city.district];
  const label =
    current == null
      ? `Encuentros ${city.solved} de ${city.total}`
      : `Encuentro ${current + 1} de ${city.total}`;
  return (
    <div className="city-trail" role="img" aria-label={label}>
      {groups.map((g) => {
        const p = placeOf(g.key);
        return (
          <div className="trail-group" key={g.key} style={{ ['--place' as string]: p.color }}>
            <span className="trail-name">{g.key === 'core' ? `Plaza ${p.name}` : p.name}</span>
            <ol>
              {g.encounters.map((e) => (
                <li
                  key={e.dilemma.id}
                  className={[
                    'trail-dot',
                    e.solved ? 'done' : '',
                    e.index === current ? 'now' : '',
                  ].join(' ')}
                >
                  {e.index === current && <RobotSvg robot={robot} className="trail-robot" />}
                </li>
              ))}
            </ol>
          </div>
        );
      })}
    </div>
  );
}
