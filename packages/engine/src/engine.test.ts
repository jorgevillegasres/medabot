import { describe, expect, it } from 'vitest';
import { ARENA } from '@medalab/content';
import { loadMvp, plain } from '../../../scripts/mvp-oracle.mjs';
import fixtures from '../fixtures/mvp-robots.json';
import {
  computeProfile,
  decode,
  encode,
  forgeRobot,
  importRobots,
  makeSerial,
  medalCode,
  predict,
  predictBout,
  SERIAL_RE,
  stripForCode,
  type Draft,
  type Robot,
} from './index';
import { randomDraft, rng } from './testing';

const mvp = loadMvp();

describe('fixtures del MVP', () => {
  for (const f of fixtures.robots) {
    describe(f.robot.name, () => {
      const draft = f.draft as unknown as Draft;
      const robot = forgeRobot(draft, { id: f.id, serial: f.serial, created: f.created });

      it('computeProfile: profile, school, coherence, compat, stage, evo, contra', () => {
        expect(computeProfile(draft)).toEqual(f.expected);
      });

      it('el robot grabado es idéntico, con el mismo orden de claves', () => {
        expect(robot).toEqual(f.robot);
        expect(Object.keys(robot)).toEqual(Object.keys(f.robot));
      });

      it('mismo código de medalla y decodificación ida y vuelta', () => {
        expect(medalCode(robot)).toBe(f.code);
        expect(decode(f.code)).toEqual(stripForCode(robot));
      });

      it('predicciones en los 12 escenarios, con y sin giro', () => {
        for (const exp of f.predictions) {
          const b = predictBout(robot, ARENA[exp.scenario]);
          expect({
            best: b.original.best,
            drivers: b.original.drivers,
            conf: b.original.conf,
          }).toEqual({ best: exp.best, drivers: exp.drivers, conf: exp.conf });
          if ('twist' in exp && exp.twist) {
            const t = b.twisted!;
            expect({ best: t.best, drivers: t.drivers, conf: t.conf, changed: t.changed }).toEqual(
              exp.twist,
            );
          } else {
            expect(b.twisted).toBeUndefined();
          }
        }
      });
    });
  }
});

describe('paridad con el código del MVP (barrido aleatorio)', () => {
  const rand = rng(2045);
  const drafts = Array.from({ length: 400 }, (_, i) => randomDraft(rand, i % 5 === 0));

  it('computeProfile idéntico en 400 borradores (80 incompletos)', () => {
    for (const d of drafts) expect(computeProfile(d)).toEqual(plain(mvp.computeProfile(d)));
  });

  it('predict idéntico en 400 robots × 12 escenarios, con y sin giro', () => {
    for (const d of drafts) {
      const r = { ...d, ...computeProfile(d) };
      for (const sc of ARENA) {
        const mine = predict(r, sc);
        const theirs = mvp.predict(r, sc, null);
        expect([mine.best, mine.drivers, mine.conf]).toEqual(
          plain([theirs.best, theirs.drivers, theirs.conf]),
        );
        if (sc.g) {
          const m2 = predict(r, sc, sc.g.w);
          const t2 = mvp.predict(r, sc, sc.g.w);
          expect([m2.best, m2.drivers, m2.conf]).toEqual(plain([t2.best, t2.drivers, t2.conf]));
        }
      }
    }
  });

  it('cubre empates de escuela y de ejes', () => {
    // Garantiza que el barrido ejercita el desempate por orden estable.
    const schoolTies = drafts.filter((d) => {
      const s = Object.values(computeProfile(d).schools).sort((a, b) => b - a);
      return s[0] === s[1];
    });
    const axisTies = drafts.filter((d) => {
      const v = Object.values(computeProfile(d).profile);
      return new Set(v).size < v.length;
    });
    expect(schoolTies.length).toBeGreaterThan(20);
    expect(axisTies.length).toBeGreaterThan(20);
  });
});

describe('código de medalla', () => {
  it('encode es idéntico al del MVP, con tildes, ñ, comillas y emoji', () => {
    for (const obj of [
      { name: 'Ñandú "el rápido" <3', x: [1, 2] },
      { name: '🤖 Medabot', limit: 'Nunca—jamás' },
      {},
    ]) {
      expect(encode(obj)).toBe(mvp.encode(obj));
      expect(decode(mvp.encode(obj))).toEqual(obj);
      expect(encode(obj)).not.toMatch(/=$/);
    }
  });

  it('decode ignora espacios alrededor', () => {
    expect(decode('  ' + encode({ a: 1 }) + '\n')).toEqual({ a: 1 });
  });
});

describe('importRobots', () => {
  const [a, b] = fixtures.robots;
  const ids = (rs: Robot[]) => rs.map((r) => r.id);

  it('importa varios códigos separados por líneas y recalcula schools', () => {
    const out = importRobots(`${a.code}\n\n  ${b.code}  `);
    expect(ids(out)).toEqual([a.id, b.id]);
    expect(out[0].schools).toEqual(a.robot.schools);
  });

  it('importa un JSON exportado (array)', () => {
    const out = importRobots(JSON.stringify([a.robot, b.robot]));
    expect(ids(out)).toEqual([a.id, b.id]);
  });

  it('omite duplicados, ids existentes y basura', () => {
    const out = importRobots(
      `${a.code} ${a.code} no-es-un-codigo ${encode({ foo: 1 })} ${b.code}`,
      {
        existingIds: [b.id],
      },
    );
    expect(ids(out)).toEqual([a.id]);
  });

  it('JSON inválido no importa nada', () => {
    expect(importRobots('[{"name":')).toEqual([]);
  });

  it('asigna id si falta y recorta el nombre a 30', () => {
    const r = { ...a.robot, id: undefined, name: 'x'.repeat(50) };
    const out = importRobots(encode(r), { newId: () => 'nuevo' });
    expect(out[0].id).toBe('nuevo');
    expect(out[0].name).toHaveLength(30);
  });
});

describe('serial', () => {
  it('formato TIPO-NNNNN y rango del MVP', () => {
    expect(makeSerial('CST', () => 0)).toBe('CST-10000');
    expect(makeSerial('CST', () => 0.999999999)).toBe('CST-99998');
    const rand = rng(1);
    for (let i = 0; i < 100; i++) expect(makeSerial('GRD', rand)).toMatch(SERIAL_RE);
  });
});
