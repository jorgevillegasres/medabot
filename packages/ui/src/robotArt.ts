// Arte de los robots, estilo «Medabot anime» (Fase H): contorno de tinta, sombra plana en dos
// tonos y brillo. Cada pieza es un fragmento SVG dibujado en un lienzo de trabajo (eje central
// x = 120, alto ≈ 20–246) que robotSvg() escala al viewBox 200×200. Los colores que llegan aquí
// ya pasaron por safeColor().

import { CATALOGS, type PartKey } from '@medalab/content';
import { HEX_RE, shade, tint } from './color';

export type Palette = { c: string; dark: string; light: string };

const INK = '#1B1B2F';
const STEEL = '#C9CED4';
const STEEL2 = '#9AA3AD';
const YELLOW = '#F5C518';
const RED = '#D8382E';
const GLINT = '#FFF6C8';

export const STROKE = `stroke="${INK}" stroke-width="3.4" stroke-linejoin="round" stroke-linecap="round"`;

export function palette(color: string): Palette {
  return { c: color, dark: shade(color, 0.25), light: tint(color, 0.55) };
}

/** El lado derecho del dibujo queda en sombra: su pieza base usa el tono oscuro. */
const farSide = (p: Palette): Palette => ({ c: p.dark, dark: shade(p.c, 0.45), light: p.c });

/** Forma con sombra plana: base con contorno, sombra sin contorno y el contorno de nuevo encima. */
const cel = (d: string, shadeD: string, p: Palette) =>
  `<path d="${d}" fill="${p.c}"/><path d="${shadeD}" fill="${p.dark}" stroke="none"/><path d="${d}" fill="none"/>`;

const glint = (d: string, p: Palette, w = 4) =>
  `<path d="${d}" fill="none" stroke="${p.light}" stroke-width="${w}"/>`;

// ===== Cabezas =====

const HEADS: ((p: Palette) => string)[] = [
  // Cuerno kabuto: casco con cuerno en V, gema y visor rasgado.
  (p) =>
    cel(
      'M88 94 L88 66 Q88 50 120 48 Q152 50 152 66 L152 94 Z',
      'M120 48 Q152 50 152 66 L152 94 L120 94 Z',
      p,
    ) +
    `<path d="M88 80 L78 94 L94 94 Z" fill="${p.dark}"/><path d="M152 80 L162 94 L146 94 Z" fill="${p.dark}"/>` +
    glint('M96 62 Q102 55 112 53', p) +
    `<rect x="96" y="66" width="48" height="16" rx="5" fill="${INK}"/>` +
    `<path d="M103 74 L113 72 M127 72 L137 74" stroke="${YELLOW}" stroke-width="4"/>` +
    `<path d="M118 52 L90 18 L104 21 L120 42 Z" fill="${YELLOW}"/><path d="M122 52 L150 18 L136 21 L120 42 Z" fill="${YELLOW}"/>` +
    `<circle cx="120" cy="50" r="6" fill="${RED}"/><circle cx="118" cy="48" r="2" fill="${GLINT}" stroke="none"/>`,
  // Domo con visor: domo redondo, visor oscuro con línea amarilla y aletas.
  (p) =>
    `<path d="M88 70 L75 55 L91 61 Z" fill="${YELLOW}"/><path d="M152 70 L165 55 L149 61 Z" fill="${YELLOW}"/>` +
    cel('M90 94 Q90 48 120 48 Q150 48 150 94 Z', 'M120 48 Q150 48 150 94 L120 94 Z', p) +
    glint('M100 60 Q108 53 118 52', p) +
    `<path d="M94 74 Q120 66 146 74 L144 88 Q120 95 96 88 Z" fill="${INK}"/>` +
    `<path d="M102 80 Q120 74 138 80" fill="none" stroke="${YELLOW}" stroke-width="3.4"/>`,
  // Antena de radar: cabeza cuadrada, plato de radar con luz roja y dos ojos.
  (p) =>
    `<path d="M120 58 L120 34" stroke-width="3.4"/>` +
    `<path d="M104 30 Q120 46 136 30 Z" fill="${STEEL}"/><circle cx="120" cy="24" r="5" fill="${RED}"/>` +
    `<circle cx="91" cy="77" r="6" fill="${STEEL2}"/><circle cx="149" cy="77" r="6" fill="${STEEL2}"/>` +
    cel(
      'M98 56 L142 56 Q148 56 148 62 L148 90 Q148 96 142 96 L98 96 Q92 96 92 90 L92 62 Q92 56 98 56 Z',
      'M120 56 L142 56 Q148 56 148 62 L148 90 Q148 96 142 96 L120 96 Z',
      p,
    ) +
    glint('M99 63 L112 63', p) +
    `<rect x="100" y="66" width="40" height="22" rx="9" fill="${INK}"/>` +
    `<circle cx="111" cy="77" r="5" fill="${YELLOW}" stroke="none"/><circle cx="129" cy="77" r="5" fill="${YELLOW}" stroke="none"/>` +
    `<circle cx="109.5" cy="75.5" r="1.6" fill="#FFFFFF" stroke="none"/><circle cx="127.5" cy="75.5" r="1.6" fill="#FFFFFF" stroke="none"/>`,
];

// ===== Brazos (dibujados del lado izquierdo del dibujo; el otro lado se refleja) =====

const upperArm = `<rect x="68" y="116" width="16" height="32" rx="6" fill="${STEEL}"/><circle cx="76" cy="150" r="6.5" fill="${STEEL2}"/>`;

const ARM: Record<'cannon' | 'pincer' | 'hand' | 'shield', (p: Palette) => string> = {
  hand: (p) =>
    upperArm +
    `<rect x="64" y="176" width="6" height="13" rx="3" fill="${STEEL}"/><rect x="71" y="177" width="6" height="15" rx="3" fill="${STEEL}"/>` +
    `<rect x="78" y="177" width="6" height="15" rx="3" fill="${STEEL}"/><rect x="85" y="175" width="6" height="11" rx="3" fill="${STEEL}"/>` +
    cel('M63 152 L91 152 L89 178 L65 178 Z', 'M77 152 L91 152 L89 178 L77 178 Z', p) +
    glint('M68 158 L68 172', p, 3),
  pincer: (p) =>
    upperArm +
    `<path d="M70 176 Q56 190 67 206 L73 199 Q66 190 77 179 Z" fill="${STEEL}"/>` +
    `<path d="M84 176 Q98 190 87 206 L81 199 Q88 190 77 179 Z" fill="${STEEL2}"/>` +
    cel('M63 152 L91 152 L86 176 L68 176 Z', 'M77 152 L91 152 L86 176 L77 176 Z', p) +
    glint('M68 158 L69 170', p, 3),
  cannon: (p) =>
    upperArm +
    `<rect x="64" y="170" width="24" height="26" rx="3" fill="${STEEL2}"/>` +
    `<path d="M70 176 L70 190 M82 176 L82 190" stroke-width="2"/>` +
    `<rect x="59" y="194" width="34" height="9" rx="3" fill="${INK}"/>` +
    cel(
      'M66 146 L86 146 Q93 146 93 153 L93 166 Q93 172 86 172 L66 172 Q59 172 59 166 L59 153 Q59 146 66 146 Z',
      'M76 146 L86 146 Q93 146 93 153 L93 166 Q93 172 86 172 L76 172 Z',
      p,
    ) +
    `<rect x="59" y="157" width="34" height="5" fill="${RED}" stroke="none"/>` +
    glint('M64 151 L72 151', p, 3),
  shield: (p) =>
    upperArm +
    cel('M90 118 L52 122 L55 168 Q72 188 89 171 Z', 'M71 120 L52 122 L55 168 Q63 178 71 181 Z', p) +
    `<path d="M72 132 L72 168 M60 148 L84 148" stroke="${YELLOW}" stroke-width="4.5"/>` +
    glint('M84 126 L85 160', p, 3),
};

const R_ARMS = [ARM.cannon, ARM.pincer, ARM.hand];
const L_ARMS = [ARM.shield, ARM.pincer, ARM.hand];

// ===== Piernas =====

const LEGS: ((p: Palette) => string)[] = [
  // Bípedas
  (p) => {
    const q = farSide(p);
    return (
      `<rect x="82" y="164" width="20" height="32" rx="5" fill="${STEEL2}"/><rect x="138" y="164" width="20" height="32" rx="5" fill="${STEEL2}"/>` +
      cel('M78 202 L106 202 L104 232 L80 232 Z', 'M92 202 L106 202 L104 232 L93 232 Z', p) +
      cel('M134 202 L162 202 L160 232 L136 232 Z', 'M148 202 L162 202 L160 232 L149 232 Z', q) +
      glint('M84 208 L85 224', p, 3) +
      `<circle cx="92" cy="200" r="7.5" fill="${STEEL}"/><circle cx="148" cy="200" r="7.5" fill="${STEEL}"/>` +
      `<rect x="68" y="230" width="42" height="14" rx="6" fill="${INK}"/><rect x="130" y="230" width="42" height="14" rx="6" fill="${INK}"/>`
    );
  },
  // Orugas
  (p) =>
    `<rect x="102" y="164" width="36" height="34" rx="4" fill="${STEEL2}"/>` +
    `<rect x="58" y="194" width="124" height="50" rx="25" fill="${INK}"/>` +
    cel(
      'M91 202 L149 202 Q172 202 172 219 Q172 236 149 236 L91 236 Q68 236 68 219 Q68 202 91 202 Z',
      'M68 222 Q70 236 91 236 L149 236 Q170 236 172 222 Z',
      p,
    ) +
    glint('M86 207 L120 207', p, 3) +
    [86, 120, 154]
      .map(
        (x) =>
          `<circle cx="${x}" cy="219" r="10" fill="${STEEL}"/><circle cx="${x}" cy="219" r="3" fill="${INK}" stroke="none"/>`,
      )
      .join(''),
  // Ruedas
  (p) =>
    `<rect x="70" y="208" width="100" height="10" rx="5" fill="${STEEL2}"/>` +
    cel(
      'M100 164 L140 164 Q146 164 146 170 L146 202 Q146 212 136 212 L104 212 Q94 212 94 202 L94 170 Q94 164 100 164 Z',
      'M120 164 L140 164 Q146 164 146 170 L146 202 Q146 212 136 212 L120 212 Z',
      p,
    ) +
    [80, 160]
      .map(
        (x) =>
          `<circle cx="${x}" cy="215" r="26" fill="${INK}"/><circle cx="${x}" cy="215" r="15" fill="${STEEL}"/>` +
          `<circle cx="${x}" cy="215" r="6" fill="${p.c}"/>` +
          `<path d="M${x - 8} 205 Q${x} 200 ${x + 8} 205" fill="none" stroke="#FFFFFF" stroke-width="2.5"/>`,
      )
      .join(''),
];

// ===== Torso =====

export function drawTorso(p: Palette): string {
  return (
    `<rect x="100" y="154" width="40" height="16" rx="5" fill="${STEEL}"/>` +
    cel(
      'M86 106 Q120 96 154 106 L150 158 Q120 168 90 158 Z',
      'M120 100 Q142 100 154 106 L150 158 Q136 164 120 166 Z',
      p,
    ) +
    glint('M94 113 Q104 106 114 105', p) +
    `<path d="M104 150 Q120 155 136 150" fill="none" stroke-width="2"/>` +
    `<circle cx="120" cy="130" r="11" fill="${YELLOW}"/><circle cx="116" cy="126" r="3" fill="${GLINT}" stroke="none"/>`
  );
}

function drawShoulders(p: Palette): string {
  const q = farSide(p);
  return (
    `<rect x="112" y="90" width="16" height="14" rx="3" fill="${STEEL}"/>` +
    `<ellipse cx="82" cy="110" rx="17" ry="13" fill="${p.c}"/>` +
    glint('M72 105 Q78 100 86 100', p, 3) +
    `<ellipse cx="158" cy="110" rx="17" ry="13" fill="${q.c}"/>`
  );
}

// ===== API =====

const MIRROR = 'matrix(-1 0 0 1 240 0)';

export const drawHead = (opt: number, p: Palette) => HEADS[opt]!(p);
export const drawLegs = (opt: number, p: Palette) => LEGS[opt]!(p);
/** side 'r' = brazo derecho del robot (izquierda del dibujo); 'l' = brazo izquierdo, reflejado y en sombra. */
export function drawArm(side: 'r' | 'l', opt: number, p: Palette): string {
  if (side === 'r') return R_ARMS[opt]!(p);
  return `<g transform="${MIRROR}">${L_ARMS[opt]!(farSide(p))}</g>`;
}

export type Parts = Record<PartKey, number>;

/** El robot completo en el lienzo de trabajo, en orden de pintado (de atrás hacia adelante). */
export function drawRobot(parts: Parts, color: string): string {
  const p = palette(color);
  return (
    drawLegs(parts.legs, p) +
    drawTorso(p) +
    drawArm('r', parts.rarm, p) +
    drawArm('l', parts.larm, p) +
    drawShoulders(p) +
    drawHead(parts.head, p)
  );
}

/** Encaje del lienzo de trabajo (x 52–190, y 18–246) en el viewBox 200×200. */
export const FIT = 'translate(-1.6 -9.6) scale(0.84)';

/** Recorte de cada parte para las miniaturas, en coordenadas del lienzo de trabajo. */
export const PART_BOX: Record<PartKey, string> = {
  head: '70 8 100 100',
  rarm: '24 104 104 104',
  larm: '112 104 104 104',
  legs: '50 150 140 100',
};

const ok = (n: unknown) => (n === 0 || n === 1 || n === 2 ? n : 0);
export const normalizeParts = (p?: Partial<Record<PartKey, unknown>>): Parts => ({
  head: ok(p?.head),
  rarm: ok(p?.rarm),
  larm: ok(p?.larm),
  legs: ok(p?.legs),
});

/** Miniatura decorativa de una medaparte (el nombre accesible lo pone el botón que la contiene). */
export function partSvg(part: PartKey, option: number, color?: string): string {
  const c = typeof color === 'string' && HEX_RE.test(color) ? color : CATALOGS.colors[0]!;
  const p = palette(c);
  const o = ok(option);
  const frag =
    part === 'head'
      ? drawHead(o, p)
      : part === 'legs'
        ? drawLegs(o, p)
        : drawArm(part === 'rarm' ? 'r' : 'l', o, p);
  return `<svg viewBox="${PART_BOX[part]}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><g ${STROKE}>${frag}</g></svg>`;
}
