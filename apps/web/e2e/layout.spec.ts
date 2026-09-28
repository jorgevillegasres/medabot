import { expect, test } from '@playwright/test';
import { playToCity, type ForgeInput } from './helpers';

const F: ForgeInput = { name: 'Jugador Uno', type: 'MDR', limit: 'Nunca tomará partido.', seed: 4 };

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

async function overflow(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const w = document.documentElement.clientWidth;
    const scrollAncestor = (el: HTMLElement) => {
      let p = el.parentElement;
      while (p) {
        const ov = getComputedStyle(p).overflowX;
        if (ov === 'auto' || ov === 'scroll') return true;
        p = p.parentElement;
      }
      return false;
    };
    const out: string[] = [];
    if (document.documentElement.scrollWidth > w) out.push('la página se desplaza a los lados');
    for (const el of document.querySelectorAll<HTMLElement>('main *')) {
      const r = el.getBoundingClientRect();
      if (r.width <= 1) continue;
      if ((r.right > w + 1 || r.left < -1) && !scrollAncestor(el)) {
        out.push(el.outerHTML.slice(0, 90));
      }
    }
    for (const b of document.querySelectorAll<HTMLElement>('main button, main .btn')) {
      // El texto es lo que no debe cortarse; se mide en su propia etiqueta y no en el botón
      // completo, que puede incluir una insignia posicionada (p. ej. el ✓ de una medaparte
      // elegida) que a propósito sobresale un poco de la esquina.
      const label = b.querySelector<HTMLElement>('span:not(.partsvg)') ?? b;
      if (label.scrollWidth > label.clientWidth + 1) out.push('texto cortado: ' + b.textContent);
    }
    return out.slice(0, 8);
  });
}

test.describe('sin desbordes a 375 px', () => {
  test.skip(({ isMobile }) => !isMobile, 'solo en celular');
  for (const path of ['/', '/entrar', '/forja/1', '/medallas']) {
    test(path, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      expect(await overflow(page)).toEqual([]);
    });
  }
  test('taller con cada pestaña', async ({ page }) => {
    await page.goto('/forja/1');
    for (const t of ['Cabeza', 'Brazos', 'Piernas']) {
      await page.getByRole('tab', { name: t }).click();
      expect(await overflow(page), t).toEqual([]);
    }
  });
  test('ciudad', async ({ page }) => {
    await playToCity(page, F);
    expect(await overflow(page)).toEqual([]);
  });
});
