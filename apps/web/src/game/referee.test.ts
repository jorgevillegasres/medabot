import { describe, expect, it } from 'vitest';
import { CIRCUITS, SCHOOLS, type CircuitKey } from '@medalab/content';
import {
  PAUSE_QUESTIONS,
  RANK_NOTE,
  REVIEW_QUESTIONS,
  circuitQuestion,
  dataQuestions,
  limitQuestions,
  rankQuestion,
} from './referee';

const all = () => [
  rankQuestion('A', 'B'),
  RANK_NOTE,
  ...limitQuestions('A'),
  ...dataQuestions(['Rostros', 'Salud']),
  ...dataQuestions(['Ninguno']),
  ...PAUSE_QUESTIONS,
  ...REVIEW_QUESTIONS,
  ...(Object.keys(CIRCUITS) as CircuitKey[]).flatMap((c) =>
    [0, 1, 2, 3, 4, 5].map((n) => circuitQuestion(c, n)),
  ),
];

describe('preguntas del Sr. Referí', () => {
  it('nunca muestran datos ocultos al estudiante', () => {
    const hidden = [...Object.values(SCHOOLS).map((s) => s.n), 'Kohlberg', 'etapa'];
    for (const q of all()) for (const h of hidden) expect(q).not.toContain(h);
  });

  it('cada circuito tiene preguntas y rotan por dilema', () => {
    for (const c of Object.keys(CIRCUITS) as CircuitKey[]) {
      expect(circuitQuestion(c, 0)).toBeTruthy();
    }
    expect(circuitQuestion('core', 0)).not.toBe(circuitQuestion('core', 1));
  });

  it('los datos sensibles piden pensar en una filtración; «Ninguno» cambia la pregunta', () => {
    expect(dataQuestions(['Salud']).join(' ')).toContain('Salud: si se filtran');
    expect(dataQuestions(['Hábitos']).join(' ')).not.toContain('filtran');
    expect(dataQuestions(['Ninguno'])).toHaveLength(1);
  });

  it('la jerarquía nombra los dos primeros principios', () => {
    expect(rankQuestion('Seguridad', 'Obediencia')).toContain('debería ganar Obediencia');
  });
});
