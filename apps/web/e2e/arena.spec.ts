// Criterio de aceptación de la Fase 3: con 3 celulares y una pantalla, una robatalla
// completa se ejecuta sin recargar; los votos no se duplican; la pantalla muestra
// "Cambió de decisión" en rojo cuando corresponde.
//
// Requiere:
//   - apps/web/.env.local (Supabase) y acceso anónimo activado;
//   - el curso demo del seed (DEMO-2045) o E2E_COURSE_CODE con los robots del seed;
//   - una sesión de profesor guardada: pnpm --filter @medalab/web e2e:profesor

import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test, type Browser, type Page } from '@playwright/test';

const COURSE = process.env.E2E_COURSE_CODE ?? 'DEMO-2045';
const TEACHER_STATE = new URL('./.auth/teacher.json', import.meta.url);
const READY = existsSync(new URL('../.env.local', import.meta.url)) && existsSync(TEACHER_STATE);

// Del seed: en el escenario 0 ("El cuerpo prestado") Centinela Kappa cambia de decisión con
// el giro y Juez Omega no (ver packages/engine/fixtures/mvp-robots.json).
const ROBOT_A = 'Centinela Kappa';
const ROBOT_B = 'Juez Omega';

async function phone(browser: Browser, name: string): Promise<Page> {
  const ctx = await browser.newContext({
    viewport: { width: 375, height: 812 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await ctx.newPage();
  await page.goto(`/entrar?c=${COURSE}`);
  await page.locator('#jName').fill(name);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/forja\/1$/);
  await page.getByRole('link', { name: 'Votar' }).click();
  return page;
}

async function vote(page: Page, a: number, b: number) {
  await page
    .getByRole('group', { name: `Opción de ${ROBOT_A}` })
    .getByRole('button')
    .nth(a)
    .click();
  await page
    .getByRole('group', { name: `Opción de ${ROBOT_B}` })
    .getByRole('button')
    .nth(b)
    .click();
  await page.getByRole('button', { name: 'Enviar predicción' }).click();
  await expect(page.getByRole('heading', { name: 'Voto registrado' })).toBeVisible();
}

test.describe('Arena en vivo', () => {
  test.skip(!READY, 'falta .env.local o la sesión de profesor (e2e/.auth/teacher.json)');
  test.skip(({ isMobile }) => isMobile, 'el escenario ya incluye celulares');
  test.setTimeout(120_000);

  test('robatalla completa con votación y giro, sin recargar', async ({ browser }) => {
    const teacherCtx = await browser.newContext({ storageState: fileURLToPath(TEACHER_STATE) });
    const arena = await teacherCtx.newPage();
    await arena.goto('/arena');
    const courseSelect = arena.getByRole('combobox', { name: 'Curso' });
    const value = await courseSelect.locator('option', { hasText: COURSE }).getAttribute('value');
    expect(value, `el profesor no tiene el curso ${COURSE}`).toBeTruthy();
    await courseSelect.selectOption(value!);

    const screen = await teacherCtx.newPage();
    await screen.goto(`/pantalla?curso=${value}`);

    const phones = await Promise.all(
      ['Ana', 'Beto', 'Caro'].map((n) => phone(browser, `${n} (e2e)`)),
    );
    for (const p of phones)
      await expect(p.getByText('Esperando la próxima robatalla')).toBeVisible();

    // Presentar.
    const optionValue = (sel: string, name: string) =>
      arena.locator(`${sel} option`, { hasText: name }).first().getAttribute('value');
    await arena.locator('#arA').selectOption((await optionValue('#arA', ROBOT_A))!);
    await arena.locator('#arB').selectOption((await optionValue('#arB', ROBOT_B))!);
    await arena.locator('#arS').selectOption('0');
    await arena.getByRole('button', { name: 'Presentar el escenario' }).click();

    await expect(screen.getByRole('heading', { name: 'El cuerpo prestado' })).toBeVisible();
    for (const p of phones)
      await expect(p.getByRole('heading', { name: '¿Qué hará cada robot?' })).toBeVisible();

    // Fase 1: tres votos.
    await vote(phones[0], 1, 0);
    await vote(phones[1], 1, 1);
    await vote(phones[2], 2, 0);
    await expect(screen.locator('.votecount')).toHaveText('Votos: 3');

    // Un voto no se duplica: el mismo celular en otra pestaña ya figura como votado.
    const again = await phones[0].context().newPage();
    await again.goto('/votar');
    await expect(again.getByRole('heading', { name: 'Voto registrado' })).toBeVisible();
    await again.close();
    await expect(screen.locator('.votecount')).toHaveText('Votos: 3');

    // Revelar.
    await arena.getByRole('button', { name: 'Revelar decisiones' }).click();
    await expect(screen.getByTestId('verdict-A')).toBeVisible();
    await expect(screen.getByTestId('verdict-B')).toBeVisible();
    await expect(screen.locator('.referee')).toContainText('Sr. Referí');
    await expect(screen.getByTestId('verdict-A')).toContainText('La clase acertó');
    for (const p of phones) await expect(p.getByTestId('verdict-A')).toBeVisible();

    // Cambiar un factor: se abre la segunda votación.
    await arena.getByRole('button', { name: 'Cambiar un factor' }).click();
    await expect(screen.getByText('Cambia un factor.')).toBeVisible();
    for (const p of phones) await expect(p.getByText('Vota otra vez')).toBeVisible();
    await vote(phones[0], 2, 0);
    await vote(phones[1], 2, 0);
    await vote(phones[2], 1, 0);

    // Revelar tras el giro.
    await arena.getByRole('button', { name: 'Revelar tras el giro' }).click();
    const changedA = screen.getByTestId('verdict-A').locator('.changed');
    await expect(changedA).toHaveText('Cambió de decisión.');
    await expect(changedA).toHaveClass(/yes/);
    const red = await changedA.evaluate((el) => getComputedStyle(el).color);
    expect(red).toBe('rgb(216, 56, 46)'); // --red #D8382E
    await expect(screen.getByTestId('verdict-B').locator('.changed')).toHaveText(
      'No cambió de decisión.',
    );
    await expect(screen.locator('.referee')).toContainText('un solo dato cambió');

    // Cerrar: los celulares vuelven a esperar y la pantalla, al mosaico.
    await arena.getByRole('button', { name: 'Cerrar robatalla' }).click();
    for (const p of phones)
      await expect(p.getByText('Esperando la próxima robatalla')).toBeVisible();
    await expect(screen.locator('.mosaic')).toBeVisible();
  });
});
