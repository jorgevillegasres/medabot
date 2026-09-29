import { describe, expect, it } from 'vitest';
import { shade, tint } from './color';

describe('shade / tint', () => {
  it('oscurece hacia negro', () => {
    expect(shade('#FFFFFF', 0.25)).toBe('#BFBFBF');
    expect(shade('#2FB39A', 0)).toBe('#2FB39A');
    expect(shade('#2FB39A', 1)).toBe('#000000');
  });
  it('aclara hacia blanco', () => {
    expect(tint('#000000', 0.5)).toBe('#808080');
    expect(tint('#2FB39A', 1)).toBe('#FFFFFF');
  });
  it('acepta #rgb', () => {
    expect(shade('#fff', 0.25)).toBe('#BFBFBF');
  });
  it('ignora el canal alfa de #rrggbbaa y #rgba', () => {
    expect(shade('#FFFFFF80', 0.25)).toBe('#BFBFBF');
    expect(shade('#ffff', 0.25)).toBe('#BFBFBF');
  });
  it('recorta amount fuera de [0,1]', () => {
    expect(shade('#808080', -1)).toBe('#808080');
    expect(tint('#808080', 2)).toBe('#FFFFFF');
  });
  it('lanza con un color inválido', () => {
    expect(() => shade('red', 0.2)).toThrow();
  });
});
