import type { PartKey } from '@medalab/content';
import { partSvg } from './robotArt';
import { robotSvg, type RobotLook } from './svg';

interface Props {
  robot: RobotLook;
  className?: string;
}

/** Robot por partes. El SVG sale de robotSvg(), que escapa todo lo que viene del usuario. */
export function RobotSvg({ robot, className }: Props) {
  return (
    <span
      className={['svgbox', className].filter(Boolean).join(' ')}
      dangerouslySetInnerHTML={{ __html: robotSvg(robot) }}
    />
  );
}

/** Miniatura decorativa de una medaparte: el nombre accesible lo pone el botón que la contiene. */
export function PartSvg({
  part,
  option,
  color,
}: {
  part: PartKey;
  option: number;
  color?: string;
}) {
  return (
    <span
      className="partsvg"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: partSvg(part, option, color) }}
    />
  );
}
