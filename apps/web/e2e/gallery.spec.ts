// Criterio de aceptación de la Fase 2: dos navegadores distintos publican robots y ambos
// los ven aparecer sin recargar. Requiere Supabase configurado (apps/web/.env.local), el
// acceso anónimo activado y un curso existente (por defecto el demo DEMO-2045 del seed).
// Los robots de prueba se llaman "E2E …" para poder limpiarlos después.

import { existsSync } from 'node:fs';
import { expect, test, type Browser, type Page } from '@playwright/test';
import { forgeInApp } from './helpers';

const COURSE = process.env.E2E_COURSE_CODE ?? 'DEMO-2045';
const ONLINE = existsSync(new URL('../.env.local', import.meta.url));

async function student(browser: Browser, name: string): Promise<Page> {
  const page = await (await browser.newContext()).newPage();
  await page.goto(`/entrar?c=${COURSE}`);
  await page.locator('#jName').fill(name);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/forja\/1$/);
  return page;
}

async function publish(page: Page, name: string, type: string) {
  await forgeInApp(page, { name, type, limit: 'Límite de prueba.', seed: 3 });
  await page.getByRole('button', { name: 'Publicar en la galería' }).click();
  await expect(page.getByText(/Publicado en la galería/)).toBeVisible();
}

test.describe('galería en tiempo real', () => {
  test.skip(!ONLINE, 'sin apps/web/.env.local: modo local');
  test.skip(({ isMobile }) => isMobile, 'basta con escritorio');

  test('dos estudiantes publican y se ven sin recargar', async ({ browser }) => {
    const tag = Date.now().toString(36).slice(-4).toUpperCase();
    const nameA = `E2E Ana ${tag}`;
    const nameB = `E2E Beto ${tag}`;

    const a = await student(browser, 'Ana (e2e)');
    const b = await student(browser, 'Beto (e2e)');

    // B abre la galería antes de que A publique.
    await b.goto('/galeria');
    await expect(b.getByRole('heading', { name: 'Galería del laboratorio' })).toBeVisible();
    await expect(b.getByRole('link', { name: new RegExp(nameA) })).toHaveCount(0);

    await publish(a, nameA, 'CST');
    // Aparece en B sin recargar (Realtime).
    await expect(b.getByRole('link', { name: new RegExp(nameA) })).toBeVisible({ timeout: 15_000 });

    await a.goto('/galeria');
    await expect(a.getByRole('link', { name: new RegExp(nameA) })).toContainText('Tu robot');

    await publish(b, nameB, 'GRD');
    await expect(a.getByRole('link', { name: new RegExp(nameB) })).toBeVisible({ timeout: 15_000 });
    // En la galería de A, el robot de B no está marcado como suyo.
    await expect(a.getByRole('link', { name: new RegExp(nameB) })).not.toContainText('Tu robot');

    // B abre la ficha del robot de A: puede verla pero no editarla.
    await b.goto('/galeria');
    await b.getByRole('link', { name: new RegExp(nameA) }).click();
    await expect(b.getByRole('heading', { name: nameA })).toBeVisible();
    await expect(b.getByRole('button', { name: 'Editar mi robot' })).toHaveCount(0);
    // Ni rastro de los datos del profesor.
    const text = await b.locator('main').innerText();
    for (const hidden of ['Consecuencialista', 'Deontológica', 'Kohlberg']) {
      expect(text).not.toContain(hidden);
    }

    // A edita su propio robot.
    await a.getByRole('link', { name: new RegExp(nameA) }).click();
    await a.getByRole('button', { name: 'Editar mi robot' }).click();
    await a.locator('#e-purpose').fill('Propósito editado en la prueba.');
    await a.getByRole('button', { name: 'Guardar' }).click();
    await expect(a.getByText('Propósito editado en la prueba.')).toBeVisible();
  });
});
