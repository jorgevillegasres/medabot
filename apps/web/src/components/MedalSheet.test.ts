import { describe, expect, it } from 'vitest';
import { PER_PAGE, chunk } from './MedalSheet';

describe('hoja de medallas', () => {
  it('6 medallas por página; la última puede quedar incompleta', () => {
    expect(PER_PAGE).toBe(6);
    expect(chunk([1, 2, 3, 4, 5, 6, 7, 8], PER_PAGE)).toEqual([
      [1, 2, 3, 4, 5, 6],
      [7, 8],
    ]);
    expect(chunk([], PER_PAGE)).toEqual([]);
  });
});
