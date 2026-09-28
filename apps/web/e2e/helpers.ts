import { expect, type Locator, type Page } from '@playwright/test';

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

/** Sigue un enlace de la cabecera; en celular abre antes el menú. */
export async function navTo(page: Page, name: string | RegExp) {
  const btn = page.getByRole('button', { name: 'Menú' });
  if (await btn.isVisible()) await btn.click();
  await page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name }).click();
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

const PART_TAB: Record<string, string> = {
  Cabeza: 'Cabeza',
  'Brazo derecho': 'Brazos',
  'Brazo izquierdo': 'Brazos',
  Piernas: 'Piernas',
};
/** Elige una medaparte: abre su pestaña y pulsa la ficha. */
export async function pickPart(page: Page, group: keyof typeof PART_TAB, option: string) {
  await page
    .getByRole('tablist', { name: 'Medapartes' })
    .getByRole('tab', { name: PART_TAB[group] })
    .click();
  await page.getByRole('group', { name: group }).getByRole('button', { name: option }).click();
}

// ===== Ciudad 2045 (forja jugada) =====

export type Press = (l: Locator) => Promise<void>;
export const clickWith: Press = (l) => l.click();
/** Activa con teclado: foco + Enter (sirve para <button> y para los lugares SVG role="button"). */
export const keyWith: Press = async (l) => {
  await l.focus();
  await l.press('Enter');
};
type Check = (where: string) => Promise<void>;

/** Taller y Yunque, hasta llegar a la ciudad. */
export async function playToCity(
  page: Page,
  f: ForgeInput,
  press: Press = clickWith,
  check?: Check,
) {
  await page.goto('/forja/1');
  await page.locator('#fName').fill(f.name);
  await page.locator('#fType').selectOption(f.type);
  await check?.('taller');
  await press(page.getByRole('button', { name: 'Ir al yunque' }));
  await press(page.getByRole('button', { name: 'Subir Privacidad de los datos' }));
  await page.locator('#fLimit').fill(f.limit);
  await check?.('yunque');
  await press(page.getByRole('button', { name: 'Salir a la ciudad' }));
  await expect(page).toHaveURL(/\/forja\/3$/);
}

/** Resuelve los encuentros pendientes del lugar abierto (hasta `max`) con el patrón de `seed`. */
export async function solveHere(
  page: Page,
  seed: number,
  press: Press = clickWith,
  max = Infinity,
) {
  const pick = pattern(seed);
  const pendingBtn = page.getByRole('button', { name: /Pendiente$/ });
  let n = 0;
  while (n < max && (await pendingBtn.count()) > 0) {
    await press(pendingBtn.first());
    const dlg = page.getByRole('dialog');
    const { option, reason } = pick(Number(await dlg.getAttribute('data-index')));
    await press(dlg.locator('.action-card').nth(option));
    await press(dlg.locator('.why button').nth(reason - 1));
    await press(dlg.getByRole('button', { name: 'Continuar' }));
    // Solo el encuentro (con data-index): tras el 6/6 de la plaza se abre otro diálogo.
    await expect(page.locator('[role="dialog"][data-index]')).toHaveCount(0);
    n++;
  }
  return n;
}

/** Entra a la Corporación, graba la medalla y devuelve el código. */
export async function enterCorporation(page: Page, press: Press = clickWith) {
  await press(page.getByRole('button', { name: /^Ir a la Corporación/ }));
  await press(page.getByRole('button', { name: 'Grabar la medalla' }));
  await expect(page).toHaveURL(/\/forja\/4$/);
  const skip = page.getByRole('button', { name: 'Saltar' });
  const shown = await skip
    .waitFor({ state: 'visible', timeout: 2000 })
    .then(() => true)
    .catch(() => false); // con movimiento reducido no hay ceremonia
  if (shown) await press(skip);
  return (await page.getByTestId('medal-code').textContent())!.trim();
}

/** Partida completa: Taller → Yunque → plaza → distrito → Ceremonia. Devuelve el código. */
export async function playGame(
  page: Page,
  f: ForgeInput,
  { keys = false, check }: { keys?: boolean; check?: Check } = {},
) {
  const press = keys ? keyWith : clickWith;
  await playToCity(page, f, press, check);
  await press(page.getByRole('button', { name: /^Ir a la Plaza/ }));
  await solveHere(page, f.seed, press);
  await press(page.getByRole('button', { name: 'Entrar al circuito' }));
  await solveHere(page, f.seed, press);
  await check?.('ciudad');
  const code = await enterCorporation(page, press);
  await check?.('ceremonia');
  return code;
}
