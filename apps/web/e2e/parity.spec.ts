// Criterio de aceptación de la Fase 1: el mismo robot forjado en el MVP y en la app nueva,
// con las mismas respuestas, produce el mismo profile, school, coherence, compat y stage.

import { expect, test } from '@playwright/test';
import { decodeCode, forgeInApp, forgeInMvp, type ForgeInput } from './helpers';

const MVP_URL = new URL('../../../reference/medalab-mvp.html', import.meta.url).href;

const CASES: ForgeInput[] = [
  { name: 'Paridad Custodio', type: 'CST', limit: 'Nunca mentirá.', seed: 0 },
  { name: 'Paridad Oráculo', type: 'ORC', limit: 'Nunca decidirá por nadie.', seed: 2 },
  { name: 'Paridad Mediador', type: 'MDR', limit: 'Nunca tomará partido.', seed: 5 },
];

test.describe('paridad MVP ↔ app nueva', () => {
  test.skip(({ isMobile }) => isMobile, 'basta con escritorio');
  // Cada prueba forja dos robots (MVP y app); con toda la suite en paralelo, 30 s se quedan cortos.
  test.setTimeout(60_000);

  for (const f of CASES) {
    test(f.name, async ({ browser }) => {
      const mvpPage = await (await browser.newContext()).newPage();
      const appPage = await (await browser.newContext()).newPage();
      const [mvp, app] = (
        await Promise.all([forgeInMvp(mvpPage, MVP_URL, f), forgeInApp(appPage, f)])
      ).map(decodeCode);

      for (const k of [
        'profile',
        'school',
        'coherence',
        'compat',
        'stage',
        'evo',
        'contra',
        'circuit',
        'rank',
        'answers',
        'reasons',
      ]) {
        expect(app[k], k).toEqual(mvp[k]);
      }
    });
  }
});
