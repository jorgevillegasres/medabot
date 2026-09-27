import type { Page } from '@playwright/test';

/** Patrón de respuestas reproducible: opción y motivo para el dilema i. */
export const pattern = (seed: number) => (i: number) => ({
  option: (i * 2 + seed) % 3,
  reason: ((i + seed) % 6) + 1,
});

export interface ForgeInput {
  name: string;
  type: string;
  limit: string;
  seed: number;
}

/** Decodifica un código de medalla (base64 sin relleno de JSON en UTF-8). */
export const decodeCode = (code: string) =>
  JSON.parse(Buffer.from(code.trim(), 'base64').toString('utf8'));

/** Fuerza la forja clásica (formulario) en esta página, en cada navegación. */
export async function forceClassicForge(page: Page) {
  await page.addInitScript(() => {
    const key = 'medalab.game.v1';
    let state = {};
    try {
      state = JSON.parse(localStorage.getItem(key) ?? 'null')?.state ?? {};
    } catch {
      /* dato corrupto: se reemplaza */
    }
    localStorage.setItem(key, JSON.stringify({ state: { ...state, classic: true }, version: 0 }));
  });
}

/** Forja un robot en la app nueva y devuelve el código de medalla. */
export async function forgeInApp(page: Page, f: ForgeInput) {
  await forceClassicForge(page);
  await page.goto('/forja/1');
  await page.locator('#fName').fill(f.name);
  await page.locator('#fType').selectOption(f.type);
  await page.getByRole('button', { name: 'Continuar a la medalla' }).click();
  await page.getByRole('button', { name: 'Subir Privacidad de los datos' }).click();
  await page.locator('#fLimit').fill(f.limit);
  await page.getByRole('button', { name: 'Ir al test moral' }).click();
  const pick = pattern(f.seed);
  const dilemmas = page.locator('article.dilema');
  for (let i = 0; i < 10; i++) {
    const { option, reason } = pick(i);
    await dilemmas.nth(i).locator('.opt').nth(option).click();
    await dilemmas
      .nth(i)
      .locator('.why button')
      .nth(reason - 1)
      .click();
  }
  await page.getByRole('button', { name: 'Grabar la medalla' }).click();
  return (await page.getByTestId('medal-code').textContent())!.trim();
}

/** Forja el mismo robot en el MVP original (reference/medalab-mvp.html). */
export async function forgeInMvp(page: Page, mvpUrl: string, f: ForgeInput) {
  await page.goto(mvpUrl);
  await page.locator('#nav button[data-view="forja"]').click();
  await page.locator('#fName').fill(f.name);
  await page.locator('#fType').selectOption(f.type);
  await page.getByRole('button', { name: 'Continuar a la medalla' }).click();
  // Misma jugada que en la app: subir el 4º principio (Privacidad) una posición.
  await page.locator('#rank li').nth(3).locator('button[data-m="-1"]').click();
  await page.locator('#fLimit').fill(f.limit);
  await page.getByRole('button', { name: 'Ir al test moral' }).click();
  const pick = pattern(f.seed);
  for (let i = 0; i < 10; i++) {
    const { option, reason } = pick(i);
    // El MVP re-renderiza con innerHTML tras cada clic: se vuelve a buscar cada vez.
    await page.locator('#dilemas .dilema').nth(i).locator('.opt').nth(option).click();
    await page
      .locator('#dilemas .dilema')
      .nth(i)
      .locator('.why button')
      .nth(reason - 1)
      .click();
  }
  await page.getByRole('button', { name: 'Grabar la medalla' }).click();
  return (await page.locator('#codeBox').textContent())!.trim();
}
