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

test('guardar y retomar a mitad de los duelos y de la ciudad', async ({ page }) => {
  await page.goto('/forja/1');
  await page.locator('#fName').fill(F.name);
  await page.locator('#fType').selectOption(F.type);
  await page.getByRole('button', { name: 'Ir al yunque' }).click();
  await page.getByRole('group', { name: 'Duelo 1' }).locator('.duel-card').first().click();
  await page.getByRole('group', { name: 'Duelo 2' }).locator('.duel-card').first().click();
  await page.reload();
  await expect(page.getByRole('group', { name: 'Duelo 3' })).toBeVisible();
  // «Atrás» deshace el último duelo.
  await page.getByRole('button', { name: 'Atrás' }).click();
  await expect(page.getByRole('group', { name: 'Duelo 2' })).toBeVisible();

  await playToCity(page, F);
  await page.getByRole('button', { name: 'Empezar' }).click();
  expect(await solveHere(page, F.seed, clickWith, 3)).toBe(3);
  await page.reload();
  await expect(page).toHaveURL(/\/forja\/3$/);
  await expect(page.getByText('Encuentros 3/10')).toBeVisible();
  await expect(page.locator('.encounter-step[data-index="3"]')).toBeVisible();
  // El menú «Forjar medalla» también retoma en la ciudad.
  await page.goto('/');
  await navTo(page, 'Forjar medalla');
  await expect(page).toHaveURL(/\/forja\/3$/);
});

test('cambiar de opinión antes de la ceremonia; después ya no', async ({ page }) => {
  const pick = pattern(F.seed);
  await playToCity(page, F);
  await page.getByRole('button', { name: 'Empezar' }).click();
  await solveHere(page, F.seed);
  await page.getByRole('button', { name: 'Entrar al circuito' }).click();
  await solveHere(page, F.seed);
  // Desde la revisión, cambiar el primer encuentro (índice 0 = 'sumision').
  await page.getByRole('button', { name: /^Cambiar: / }).first().click();
  const changed = (pick(0).option + 1) % 3;
  await page.locator('.action-card').nth(changed).click();
  await page.getByRole('button', { name: 'Siguiente' }).click();
  await page.getByRole('button', { name: 'Volver a la revisión' }).click();
  await expect(page.getByRole('heading', { name: 'Revisa tus decisiones' })).toBeVisible();
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

test('al avanzar, el foco va al título del paso y Tab llega a las opciones', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'teclado: escritorio');
  await playToCity(page, F);
  await page.getByRole('button', { name: 'Empezar' }).click();
  const title = page.locator('.encounter-step .step-title');
  await expect(title).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('.action-card').first()).toBeFocused();
});

test('Siguiente espera la decisión y el motivo', async ({ page }) => {
  await playToCity(page, F);
  await page.getByRole('button', { name: 'Empezar' }).click();
  const next = page.getByRole('button', { name: 'Siguiente' });
  await expect(next).toBeDisabled();
  await page.locator('.action-card').first().click();
  await next.click();
  await expect(page.getByRole('heading', { name: '¿Por qué lo hace?' })).toBeVisible();
  await expect(next).toBeDisabled();
  await page.locator('.why button').first().click();
  await expect(page.getByText('Resuelto')).toBeVisible();
  await expect(next).toBeEnabled();
});

test('la ceremonia se salta con una tecla', async ({ page, isMobile }) => {
  test.skip(isMobile, 'teclado: escritorio');
  await playToCity(page, F);
  await page.getByRole('button', { name: 'Empezar' }).click();
  await solveHere(page, F.seed);
  await page.getByRole('button', { name: 'Entrar al circuito' }).click();
  await solveHere(page, F.seed);
  await page.getByRole('button', { name: /^Entrar a la Corporación/ }).click();
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
