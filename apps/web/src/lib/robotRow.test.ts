import { describe, expect, it } from 'vitest';
import { decode, forgeRobot, importRobots, medalCode, type Draft } from '@medalab/engine';
import fixtures from '../../../../packages/engine/fixtures/mvp-robots.json';
import { robotToInsert, rowToRobot, type RobotRow } from './robotRow';

/** Simula lo que devuelve Postgres tras insertar (numeric llega como texto). */
function roundTrip(insert: ReturnType<typeof robotToInsert>, created: string): RobotRow {
  return {
    ...insert,
    id: insert.id ?? '11111111-2222-4333-8444-555555555555',
    owner_id: 'owner',
    stage: insert.stage == null ? null : Number(insert.stage).toFixed(1),
    created_at: created,
  } as RobotRow;
}

describe('robot ↔ fila', () => {
  for (const f of fixtures.robots) {
    it(`${f.robot.name}: ida y vuelta conserva el robot y su código de medalla`, () => {
      const robot = forgeRobot(f.draft as unknown as Draft, {
        id: f.id,
        serial: f.serial,
        created: f.created,
      });
      const row = roundTrip(robotToInsert(robot, 'curso'), f.created);
      expect(row.legacy_id).toBe(f.id); // los ids del MVP no son UUID
      const back = rowToRobot(row);
      expect(back).toEqual(robot);
      expect(Object.keys(back)).toEqual(Object.keys(robot));
      expect(medalCode(back)).toBe(f.code);
    });
  }

  it('importar un código del MVP y publicarlo produce una ficha idéntica', () => {
    const f = fixtures.robots[2];
    const [imported] = importRobots(f.code);
    const back = rowToRobot(roundTrip(robotToInsert(imported, 'curso'), imported.created));
    expect(back).toEqual({ ...(decode(f.code) as object), schools: f.robot.schools });
  });

  it('un id UUID se usa como id de la fila', () => {
    const f = fixtures.robots[0];
    const id = crypto.randomUUID();
    const robot = forgeRobot(f.draft as unknown as Draft, {
      id,
      serial: f.serial,
      created: f.created,
    });
    const ins = robotToInsert(robot, 'curso');
    expect(ins.id).toBe(id);
    expect(ins.legacy_id).toBeNull();
    expect(rowToRobot(roundTrip(ins, f.created)).id).toBe(id);
  });
});
