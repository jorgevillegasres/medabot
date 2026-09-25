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
