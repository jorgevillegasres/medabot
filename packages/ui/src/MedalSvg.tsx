import { medalSvg, type MedalLook } from './svg';

interface Props {
  robot: MedalLook;
  className?: string;
}

/** Medalla hexagonal con radar de 6 ejes. El SVG sale de medalSvg(), que sanea sus entradas. */
export function MedalSvg({ robot, className }: Props) {
  return (
    <span
      className={['svgbox', className].filter(Boolean).join(' ')}
      dangerouslySetInnerHTML={{ __html: medalSvg(robot) }}
    />
  );
}
