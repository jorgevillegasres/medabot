import { describe, expect, it } from 'vitest';
import { CATALOGS, type PartKey } from '@medalab/content';
import { partSvg } from './robotArt';
import { robotSvg } from './svg';

const PARTS: PartKey[] = ['head', 'rarm', 'larm', 'legs'];

/** Etiquetas balanceadas: suficiente para detectar SVG roto al concatenar fragmentos. */
function wellFormed(svg: string): boolean {
  const stack: string[] = [];
  for (const m of svg.matchAll(/<(\/?)([a-zA-Z]+)\b[^>]*?(\/?)>/g)) {
    const [, close, tag, self] = m;
    if (self) continue;
    if (close) {
      if (stack.pop() !== tag) return false;
    } else stack.push(tag!);
  }
  return stack.length === 0;
}

const combo = (n: number) => ({
  head: n % 3,
  rarm: Math.floor(n / 3) % 3,
  larm: Math.floor(n / 9) % 3,
  legs: Math.floor(n / 27) % 3,
});

describe('robot estilo A', () => {
  it('las 81 combinaciones en los 7 colores producen SVG válido y pintado', () => {
    for (let n = 0; n < 81; n++)
      for (const color of CATALOGS.colors) {
        const s = robotSvg({ name: 'R', color, parts: combo(n) });
        expect(s.startsWith('<svg viewBox="0 0 200 200"')).toBe(true);
        expect(s).toContain('role="img"');
        expect(s).toContain(`fill="${color}"`);
        expect(wellFormed(s), `combo ${n} ${color}`).toBe(true);
      }
  });

  it('escapa el nombre', () => {
    const s = robotSvg({ name: `R&D <x> "y" 'z'`, color: '#2FB39A' });
    expect(s).toContain('aria-label="Robot R&amp;D &lt;x&gt; &quot;y&quot; &#39;z&#39;"');
    expect(s).not.toContain('<x>');
  });

  it('rechaza colores maliciosos', () => {
    const s = robotSvg({ name: 'R', color: '#fff" onload="alert(1)' });
    expect(s).not.toContain('onload');
    expect(s).toContain(`fill="${CATALOGS.colors[0]}"`);
  });

  it('cada opción de cada parte dibuja algo distinto', () => {
    for (const k of PARTS) {
      const out = [0, 1, 2].map((i) =>
        robotSvg({
          name: 'R',
          color: '#2FB39A',
          parts: { head: 0, rarm: 0, larm: 0, legs: 0, [k]: i },
        }),
      );
      expect(new Set(out).size, k).toBe(3);
    }
  });

  it('partes fuera de rango caen en la opción 0', () => {
    const base = robotSvg({ name: 'R', color: '#2FB39A', parts: combo(0) });
    const bad = robotSvg({
      name: 'R',
      color: '#2FB39A',
      parts: { head: 7, rarm: -1, larm: 1.5, legs: NaN } as never,
    });
    expect(bad).toBe(base);
  });

  it('sin partes ni color usa los valores por defecto', () => {
    expect(robotSvg({})).toBe(robotSvg({ name: '', color: CATALOGS.colors[0], parts: combo(0) }));
  });
});

describe('partSvg', () => {
  it('una miniatura decorativa por parte y opción', () => {
    for (const k of PARTS)
      for (let i = 0; i < 3; i++) {
        const s = partSvg(k, i, '#D8382E');
        expect(s.startsWith('<svg '), `${k}${i}`).toBe(true);
        expect(s).toContain('aria-hidden="true"');
        expect(s).not.toContain('role="img"');
        expect(wellFormed(s)).toBe(true);
      }
  });
  it('rechaza colores maliciosos', () => {
    expect(partSvg('head', 0, '#fff" onload="x')).not.toContain('onload');
  });
});
