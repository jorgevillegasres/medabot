import { describe, expect, it } from 'vitest';
import fixtures from '../../engine/fixtures/mvp-robots.json';
import { PRINT_WIDTH, printableMedalSvg } from './printMedal';
import { medalSvg } from './svg';

const FONT = 'data:font/woff2;base64,d09GMgABAAAA==';
const robot = fixtures.robots[0].robot;

describe('printableMedalSvg', () => {
  it('es la medalla de pantalla con la fuente incrustada justo después de <svg>', () => {
    const plain = medalSvg(robot);
    const printable = printableMedalSvg(robot, FONT);
    expect(printable).toContain(`@font-face{font-family:'Archivo';font-weight:900`);
    expect(printable).toContain(`src:url(${FONT}) format('woff2')`);
    // Quitando el bloque <defs> queda exactamente el SVG de pantalla.
    expect(printable.replace(/<defs><style>[^<]*<\/style><\/defs>/, '')).toBe(plain);
    expect(printable.indexOf('<defs>')).toBe(plain.indexOf('>') + 1);
  });

  it('rechaza cualquier cosa que no sea un data URL woff2', () => {
    for (const bad of [
      'https://x.test/f.woff2',
      'data:font/woff2;base64,AA");}</style><script>',
      '',
    ]) {
      expect(() => printableMedalSvg(robot, bad)).toThrow();
    }
  });

  it('tamaño de impresión con la proporción de la medalla (2400×2550)', () => {
    expect(PRINT_WIDTH).toBe(2400);
    expect(Math.round((PRINT_WIDTH * 340) / 320)).toBe(2550);
  });
});
