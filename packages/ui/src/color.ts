// Sombras y brillos del arte del robot. Aceptan los mismos formatos que safeColor() deja pasar.

const HEX_RE = /^#([0-9A-Fa-f]{3,4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/;

function rgb(hex: string): [number, number, number] {
  if (!HEX_RE.test(hex)) throw new Error(`Color inválido: ${hex}`);
  let h = hex.slice(1);
  if (h.length <= 4) h = [...h.slice(0, 3)].map((c) => c + c).join('');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const toHex = (c: number[]) =>
  '#' +
  c
    .map((v) => Math.round(v).toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();

/** Mezcla el color con negro. amount 0 = igual, 1 = negro. */
export function shade(hex: string, amount: number): string {
  const a = clamp01(amount);
  return toHex(rgb(hex).map((v) => v * (1 - a)));
}

/** Mezcla el color con blanco. amount 0 = igual, 1 = blanco. */
export function tint(hex: string, amount: number): string {
  const a = clamp01(amount);
  return toHex(rgb(hex).map((v) => v + (255 - v) * a));
}
