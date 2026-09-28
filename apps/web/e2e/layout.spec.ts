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
