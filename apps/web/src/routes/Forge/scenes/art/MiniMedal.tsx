import { hexPoints } from './hex';

interface Props {
  color: string;
  /** Nombre del eje que destella, o null. */
  flash: string | null;
  /** Cambia en cada destello para reiniciar la animación. */
  flashKey?: number;
}

/** Mini-medalla de la interfaz fija: solo el hexágono y su color, sin radar (sin números). */
export function MiniMedal({ color, flash, flashKey }: Props) {
  return (
    <span className="mini-medal">
      <svg viewBox="0 0 40 40" aria-hidden="true" key={flashKey} className={flash ? 'flash' : ''}>
        <polygon points={hexPoints(20, 20, 19)} fill="#1B1B2F" />
        <polygon points={hexPoints(20, 20, 16)} fill={color} />
        <polygon points={hexPoints(20, 20, 10)} fill="#FBF6E6" />
      </svg>
      {flash && (
        <span className="flash-label" key={`l${flashKey}`}>
          ✦ {flash}
        </span>
      )}
    </span>
  );
}
