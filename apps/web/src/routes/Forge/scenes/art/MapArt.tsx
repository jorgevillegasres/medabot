import type { PlaceStatus } from '../../../../game/progress';
import type { Place } from '../../../../game/city';

const INK = '#1B1B2F';
const PAPER = '#FBF6E6';

/** Edificio de un distrito. */
export function Building({
  place,
  status,
  note,
}: {
  place: Place;
  status: PlaceStatus;
  note?: string;
}) {
  const { x, y, color, name } = place;
  return (
    <g className={`building ${status}`} transform={`translate(${x} ${y})`}>
      <polygon points="-34,-14 0,-38 34,-14" fill={color} stroke={INK} strokeWidth="3" />
      <rect
        x="-30"
        y="-14"
        width="60"
        height="42"
        rx="4"
        fill={color}
        stroke={INK}
        strokeWidth="3"
      />
      <rect x="-22" y="-6" width="10" height="10" fill={PAPER} stroke={INK} strokeWidth="2" />
      <rect x="12" y="-6" width="10" height="10" fill={PAPER} stroke={INK} strokeWidth="2" />
      <rect x="-8" y="8" width="16" height="20" fill={INK} />
      {status === 'locked' && (
        <g className="padlock">
          <path d="M-6 -2 v-6 a6 6 0 0 1 12 0 v6" fill="none" stroke={INK} strokeWidth="3" />
          <rect x="-10" y="-3" width="20" height="16" rx="3" fill={INK} />
        </g>
      )}
      {status === 'done' && (
        <path
          d="M-9 -48 l6 6 l12 -14"
          fill="none"
          stroke={INK}
          strokeWidth="4"
          strokeLinecap="round"
        />
      )}
      <text y="44" textAnchor="middle" className="place-label">
        {name}
      </text>
      {note && (
        <text y="58" textAnchor="middle" className="place-note">
          {note}
        </text>
      )}
    </g>
  );
}

/** La plaza central. */
export function Plaza({ place, status }: { place: Place; status: PlaceStatus }) {
  return (
    <g className={`building ${status}`} transform={`translate(${place.x} ${place.y})`}>
      <circle r="34" fill={place.color} stroke={INK} strokeWidth="3" />
      <circle r="18" fill={PAPER} stroke={INK} strokeWidth="3" />
      <circle r="6" fill="#2FB39A" stroke={INK} strokeWidth="2" />
      {status === 'done' && (
        <path
          d="M-9 -44 l6 6 l12 -14"
          fill="none"
          stroke={INK}
          strokeWidth="4"
          strokeLinecap="round"
        />
      )}
      <text y="50" textAnchor="middle" className="place-label">
        Plaza {place.name}
      </text>
    </g>
  );
}

/** La torre de la Corporación. */
export function Tower({ x, y, name, open }: { x: number; y: number; name: string; open: boolean }) {
  return (
    <g className={open ? 'building open' : 'building locked'} transform={`translate(${x} ${y})`}>
      <line x1="0" y1="-40" x2="0" y2="-26" stroke={INK} strokeWidth="3" />
      <circle cy="-42" r="5" fill={open ? '#D8382E' : '#9AA3AD'} stroke={INK} strokeWidth="2" />
      <rect
        x="-18"
        y="-26"
        width="36"
        height="50"
        rx="4"
        fill={open ? '#F5C518' : '#9AA3AD'}
        stroke={INK}
        strokeWidth="3"
      />
      <rect x="-8" y="6" width="16" height="18" fill={INK} />
      <text y="38" textAnchor="middle" className="place-label">
        {name}
      </text>
    </g>
  );
}
