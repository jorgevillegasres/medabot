import { expect, test } from '@playwright/test';

test.describe('cabecera', () => {
  test('en celular cabe en una línea y el menú abre y cierra', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'solo en celular');
    await page.goto('/');
    const header = page.locator('header.watch');
    expect((await header.boundingBox())!.height).toBeLessThan(80);
    const nav = page.getByRole('navigation', { name: 'Principal' });
    const btn = page.getByRole('button', { name: 'Menú' });
    await expect(btn).toHaveAttribute('aria-expanded', 'false');
    await expect(nav.getByRole('link', { name: 'Mis medallas' })).toBeHidden();
    await btn.click();
    await expect(btn).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Escape');
    await expect(btn).toHaveAttribute('aria-expanded', 'false');
    await expect(btn).toBeFocused();
    await btn.click();
    await nav.getByRole('link', { name: 'Mis medallas' }).click();
    await expect(page).toHaveURL(/\/medallas$/);
    await expect(nav.getByRole('link', { name: 'Mis medallas' })).toBeHidden();
  });

  test('en escritorio los enlaces están a la vista y no hay botón', async ({ page, isMobile }) => {
    test.skip(isMobile, 'solo en escritorio');
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Menú' })).toBeHidden();
    await expect(
      page
        .getByRole('navigation', { name: 'Principal' })
        .getByRole('link', { name: 'Mis medallas' }),
    ).toBeVisible();
  });
});

test('la forja muestra el acto actual', async ({ page }) => {
  await page.goto('/forja/1');
  const steps = page.getByRole('group', { name: 'Pasos de la forja' });
  await expect(steps).toContainText('Acto 1 de 4 · Taller');
  await expect(steps.locator('li[aria-current="step"]')).toHaveCount(1);
  await expect(page.getByRole('heading', { name: 'Acto 1 · El Taller' })).toBeAttached();
});

test('selector de piezas: pestañas con flechas y miniaturas', async ({ page }) => {
  await page.goto('/forja/1');
  const tabs = page.getByRole('tablist', { name: 'Medapartes' });
  const cabeza = tabs.getByRole('tab', { name: 'Cabeza' });
  await expect(cabeza).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('group', { name: 'Cabeza' }).locator('.partsvg svg')).toHaveCount(3);
  await cabeza.focus();
  await page.keyboard.press('ArrowRight');
  const brazos = tabs.getByRole('tab', { name: 'Brazos' });
  await expect(brazos).toBeFocused();
  await expect(brazos).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('group', { name: 'Brazo derecho' })).toBeVisible();
  await expect(page.getByRole('group', { name: 'Brazo izquierdo' })).toBeVisible();
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await expect(tabs.getByRole('tab', { name: 'Piernas' })).toBeFocused();
  const orugas = page
    .getByRole('group', { name: 'Piernas' })
    .getByRole('button', { name: 'Orugas' });
  await orugas.click();
  await expect(orugas).toHaveAttribute('aria-pressed', 'true');
});
