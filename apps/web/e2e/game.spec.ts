// Fase G · Ciudad 2045 (docs/superpowers/specs/2026-09-26-ciudad-2045-design.md §7).
import { expect, test, type Page } from '@playwright/test';
import {
  clickWith,
  decodeCode,
  enterCorporation,
  forgeInApp,
  navTo,
  pattern,
  playGame,
  playToCity,
  solveHere,
  type ForgeInput,
} from './helpers';

const F: ForgeInput = { name: 'Jugador Uno', type: 'MDR', limit: 'Nunca tomará partido.', seed: 4 };
const HIDDEN = ['Consecuencialista', 'Deontológica', 'De la virtud', 'Del cuidado', 'Kohlberg'];

async function checkScreen(page: Page, where: string) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow, `desbordamiento en ${where}`).toBeLessThanOrEqual(0);
  const text = await page.locator('main').innerText();
  for (const h of HIDDEN) expect(text, `${h} en ${where}`).not.toContain(h);
}

test('partida completa: taller → yunque → ciudad → ceremonia', async ({ page }) => {
  const code = await playGame(page, F, { check: (w) => checkScreen(page, w) });
  const r = decodeCode(code);
  expect(r.name).toBe(F.name);
  expect(r.circuit).toBe('vinculos');
  await expect(page.getByRole('heading', { name: F.name })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Descargar medalla PNG' })).toBeVisible();
});

test('paridad: jugando y con el formulario se obtiene la misma medalla', async ({
  browser,
  isMobile,
}) => {
  test.skip(isMobile, 'basta con escritorio');
  const game = await (await browser.newContext()).newPage();
  const form = await (await browser.newContext()).newPage();
  const [a, b] = (await Promise.all([playGame(game, F), forgeInApp(form, F)])).map(decodeCode);
  for (const k of ['id', 'serial', 'created']) {
    delete a[k];
    delete b[k];
  }
  expect(a).toEqual(b);
});

test('guardar y retomar a mitad de la ciudad', async ({ page }) => {
  await playToCity(page, F);
  await page.getByRole('button', { name: /^Ir a la Plaza/ }).click();
  expect(await solveHere(page, F.seed, clickWith, 3)).toBe(3);
  await page.reload();
  await expect(page).toHaveURL(/\/forja\/3$/);
  await expect(page.getByText('Encuentros 3/10')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Plaza Medabots' })).toBeVisible();
  // El menú «Forjar medalla» también retoma en la ciudad.
  await page.goto('/');
  await navTo(page, 'Forjar medalla');
  await expect(page).toHaveURL(/\/forja\/3$/);
});

test('cambiar de opinión antes de la ceremonia; después ya no', async ({ page }) => {
  const pick = pattern(F.seed);
  await playToCity(page, F);
  await page.getByRole('button', { name: /^Ir a la Plaza/ }).click();
  await solveHere(page, F.seed);
  await page.getByRole('button', { name: 'Entrar al circuito' }).click();
  await solveHere(page, F.seed);
  // Volver a la plaza y cambiar el primer encuentro (índice 0 = 'sumision').
  await page.getByRole('button', { name: /^Ir a la Plaza/ }).click();
  await page.getByRole('button', { name: /^1\. / }).click();
  const changed = (pick(0).option + 1) % 3;
  const dlg = page.getByRole('dialog');
  await dlg.locator('.action-card').nth(changed).click();
  await dlg.getByRole('button', { name: 'Continuar' }).click();
  const r = decodeCode(await enterCorporation(page));
  expect(r.answers.sumision).toBe(changed);
  // Grabada la medalla, la ciudad queda cerrada.
  await page.goto('/forja/3');
  await expect(page).toHaveURL(/\/forja\/4$/);
});

test('se juega entera con teclado y movimiento reducido', async ({ browser, isMobile }) => {
  test.skip(isMobile, 'teclado: escritorio');
  const page = await (await browser.newContext({ reducedMotion: 'reduce' })).newPage();
  const code = await playGame(page, F, { keys: true });
  expect(decodeCode(code).name).toBe(F.name);
  // Con movimiento reducido la Ceremonia va directo al resultado.
  await expect(page.getByRole('button', { name: 'Saltar' })).toHaveCount(0);
});

test('con Tab se llega a la plaza, a sus encuentros y el diálogo retiene el foco', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'teclado: escritorio');
  await playToCity(page, F);
  // Desde el principio de la página, Tab hasta la plaza (primer lugar del mapa).
  await page.locator('body').focus();
  const plaza = page.getByRole('button', { name: /^Ir a la Plaza/ });
  let reached = false;
  for (let i = 0; i < 25 && !reached; i++) {
    await page.keyboard.press('Tab');
    reached = await plaza.evaluate((el) => el === document.activeElement);
  }
  expect(reached, 'la plaza no se alcanza con Tab').toBe(true);
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Plaza Medabots' })).toBeVisible();
  // Tab hasta el primer encuentro pendiente y abrirlo con Enter.
  const first = page.getByRole('button', { name: /Pendiente$/ }).first();
  reached = false;
  for (let i = 0; i < 25 && !reached; i++) {
    await page.keyboard.press('Tab');
    reached = await first.evaluate((el) => el === document.activeElement);
  }
  expect(reached, 'el encuentro no se alcanza con Tab').toBe(true);
  await page.keyboard.press('Enter');
  const dlg = page.locator('[role="dialog"][data-index]');
  await expect(dlg).toBeVisible();
  // Dentro del diálogo, Tab nunca sale de él.
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Tab');
    expect(await dlg.evaluate((el) => el.contains(document.activeElement))).toBe(true);
  }
  // Escape cierra y el foco vuelve al botón del encuentro.
  await page.keyboard.press('Escape');
  await expect(dlg).toHaveCount(0);
  expect(await first.evaluate((el) => el === document.activeElement)).toBe(true);
});

test('la ceremonia se salta con una tecla', async ({ page, isMobile }) => {
  test.skip(isMobile, 'teclado: escritorio');
  await playToCity(page, F);
  await page.getByRole('button', { name: /^Ir a la Plaza/ }).click();
  await solveHere(page, F.seed);
  await page.getByRole('button', { name: 'Entrar al circuito' }).click();
  await solveHere(page, F.seed);
  await page.getByRole('button', { name: /^Ir a la Corporación/ }).click();
  await page.getByRole('button', { name: 'Grabar la medalla' }).click();
  await expect(page.getByRole('button', { name: 'Saltar' })).toBeVisible();
  await page.keyboard.press('Escape');
  // La ceremonia completa dura ~4 s; saltada, el resultado aparece de inmediato.
  await expect(page.getByTestId('medal-code')).toBeVisible({ timeout: 2000 });
});

test('«Ver como formulario» cambia de modo sin perder datos', async ({ page }) => {
  await page.goto('/forja/1');
  await page.locator('#fName').fill('Alterno');
  await page.getByRole('button', { name: 'Ver como formulario' }).click();
  await expect(page.getByRole('button', { name: 'Continuar a la medalla' })).toBeVisible();
  await expect(page.locator('#fName')).toHaveValue('Alterno');
  await page.getByRole('button', { name: 'Ver como juego' }).click();
  await expect(page.getByRole('button', { name: 'Ir al yunque' })).toBeVisible();
});

test('los distritos ajenos y la Corporación avisan que están cerrados', async ({ page }) => {
  await playToCity(page, F);
  await page.getByRole('button', { name: 'Circuito Guerra: próximamente' }).click();
  await expect(page.getByRole('status').first()).toContainText('se abre más adelante');
  await page.getByRole('button', { name: /^Corporación Medabot: resuelve/ }).click();
  await expect(page.getByRole('status').first()).toContainText('Resuelve los 10 encuentros');
});
