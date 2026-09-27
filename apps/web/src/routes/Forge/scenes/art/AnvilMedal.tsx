import { useId } from 'react';
import { hexPoints } from './hex';

const MAX_CHARS = 90;

/** Medalla en bruto sobre el yunque, con el límite infranqueable grabado en el borde. */
export function AnvilMedal({ color, limit }: { color: string; limit: string }) {
  const text = limit.trim()
    ? limit.trim().toUpperCase().slice(0, MAX_CHARS)
    : 'AQUÍ SE GRABA EL LÍMITE INFRANQUEABLE';
  const ringId = `limit-ring-${useId().replace(/:/g, '')}`;
  return (
    <svg viewBox="0 0 320 300" className="anvil-art" aria-hidden="true">
      <path d="M40 232 H280 L262 258 H58 Z" fill="#1B1B2F" />
      <rect x="120" y="258" width="80" height="18" fill="#1B1B2F" />
      <path d="M90 276 H230 L240 292 H80 Z" fill="#1B1B2F" />
      <polygon points={hexPoints(160, 125, 118)} fill="#1B1B2F" />
      <polygon points={hexPoints(160, 125, 110)} fill={color} stroke="#1B1B2F" strokeWidth="3" />
      <polygon points={hexPoints(160, 125, 82)} fill="#FBF6E6" stroke="#1B1B2F" strokeWidth="3" />
      <defs>
        <path id={ringId} d="M160,125 m-95,0 a95,95 0 1,1 190,0 a95,95 0 1,1 -190,0" />
      </defs>
      <text fontSize="11" fontWeight="900" fill="#1B1B2F" letterSpacing="1">
        <textPath href={`#${ringId}`}>{text}</textPath>
      </text>
      <text x="160" y="137" textAnchor="middle" fontSize="36" fontWeight="900" fill="#1B1B2F">
        ?
      </text>
    </svg>
  );
}
