// Reacción tras cada encuentro: el eje que más activó la opción elegida (spec §2, Acto 3).
import { AXES, type AxisKey, type Option } from '@medalab/content';

/** Eje con mayor peso en la opción; en empate, el primero en el orden S, O, H, P, A, L. */
export function dominantAxis(option: Pick<Option, 'w'>): AxisKey {
  let best = 0;
  for (let k = 1; k < option.w.length; k++) if (option.w[k] > option.w[best]) best = k;
  return AXES[best].k;
}
