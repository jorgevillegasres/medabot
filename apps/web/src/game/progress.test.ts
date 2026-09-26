import { describe, expect, it } from 'vitest';
import { DILEMMAS, TYPES, TYPE_CIRCUIT, testFor } from '@medalab/content';
import { cityState } from './progress';

/** Borrador con esos dilemas respondidos (opción 0, motivo 4). */
const solved = (type: string, ids: string[]) => ({
  type,
  answers: Object.fromEntries(ids.map((id) => [id, 0])),
  reasons: Object.fromEntries(ids.map((id) => [id, 4])),
});
const coreIds = testFor('CST')
  .filter((d) => d.c === 'core')
  .map((d) => d.id);
const homeIds = (type: string) =>
  testFor(type)
    .filter((d) => d.c !== 'core')
    .map((d) => d.id);

describe('cityState', () => {
  it('al inicio: plaza abierta, distrito del tipo cerrado, Corporación cerrada', () => {
    const s = cityState(solved('CST', []));
    expect(s.plaza.status).toBe('open');
    expect(s.district.key).toBe('umbral');
    expect(s.district.status).toBe('locked');
    expect(s.corporationOpen).toBe(false);
    expect([s.solved, s.total]).toEqual([0, 10]);
  });

  it('el distrito se abre justo al resolver los 6 encuentros de la plaza', () => {
    expect(cityState(solved('CST', coreIds.slice(0, 5))).district.status).toBe('locked');
    const s = cityState(solved('CST', coreIds));
    expect(s.plaza.status).toBe('done');
    expect(s.district.status).toBe('open');
  });

  it('una opción sin motivo no cuenta como resuelta', () => {
    const d = solved('CST', coreIds);
    delete d.reasons[coreIds[0]];
    const s = cityState(d);
    expect(s.plaza.solved).toBe(5);
    expect(s.district.status).toBe('locked');
  });

  it('la Corporación se abre con 10 de 10', () => {
    const almost = cityState(solved('CST', [...coreIds, ...homeIds('CST').slice(0, 3)]));
    expect(almost.corporationOpen).toBe(false);
    const s = cityState(solved('CST', [...coreIds, ...homeIds('CST')]));
    expect(s.district.status).toBe('done');
    expect(s.corporationOpen).toBe(true);
    expect(s.solved).toBe(10);
  });

  it.each(TYPES.map((t) => [t.c]))(
    '%s lleva a su distrito y los otros cinco quedan cerrados',
    (type) => {
      const s = cityState(solved(type, []));
      expect(s.district.key).toBe(TYPE_CIRCUIT[type]);
      expect(s.closed).toHaveLength(5);
      expect(s.closed).not.toContain(s.district.key);
    },
  );

  it('los encuentros conservan su índice en testFor', () => {
    const s = cityState(solved('GRD', []));
    const all = [...s.plaza.encounters, ...s.district.encounters];
    expect(all.map((e) => e.index)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(all.map((e) => e.dilemma.id)).toEqual(testFor('GRD').map((d) => d.id));
  });

  it('respuestas de dilemas de otro circuito no cuentan', () => {
    const guerra = DILEMMAS.filter((d) => d.c === 'guerra').map((d) => d.id);
    const s = cityState(solved('CST', [...coreIds, ...guerra]));
    expect(s.solved).toBe(6);
    expect(s.district.solved).toBe(0);
  });
});
