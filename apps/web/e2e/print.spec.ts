// Fase 4 · Medallas para imprimir: PNG 2400×2550, SVG con fuente incrustada, hoja A4 de 6 por página.
import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import fixtures from '../../../packages/engine/fixtures/mvp-robots.json' with { type: 'json' };
import { forgeInApp } from './helpers';

test.describe('medallas para imprimir', () => {
  test.skip(({ isMobile }) => isMobile, 'descargas y PDF: escritorio');

  test('PNG de 2400×2550 y SVG con la fuente incrustada', async ({ page }) => {
    await forgeInApp(page, { name: 'Imprenta Uno', type: 'ARC', limit: 'Nunca.', seed: 1 });

    const pngDl = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Descargar medalla PNG' }).click();
    const png = readFileSync(await (await pngDl).path());
    // Firma PNG y cabecera IHDR: ancho y alto en los bytes 16–23.
    expect(png.subarray(1, 4).toString()).toBe('PNG');
    expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([2400, 2550]);

    const svgDl = page.waitForEvent('download');
    await page.getByRole('button', { name: 'SVG para imprenta' }).click();
    const svg = readFileSync(await (await svgDl).path(), 'utf8');
    expect(svg).toMatch(/^<svg /);
    expect(svg).toContain("@font-face{font-family:'Archivo';font-weight:900");
    expect(svg).toContain('data:font/woff2;base64,');
    expect(svg).toContain('Imprenta Uno');
  });

  test('hoja A4: 7 medallas → 2 páginas, sin la interfaz de la app', async ({ page }) => {
    // 7 robots en este dispositivo (los 3 fixtures del MVP con ids distintos).
    const robots = Array.from({ length: 7 }, (_, i) => ({
      ...fixtures.robots[i % 3].robot,
      id: `hoja-${i}`,
      name: `Hoja ${i + 1}`,
    }));
    await page.addInitScript((rs) => {
      localStorage.setItem(
        'medalab.robots.v2',
        JSON.stringify({ state: { robots: rs }, version: 0 }),
      );
    }, robots);

    await page.goto('/medallas');
    await page.getByRole('link', { name: 'Hoja para imprimir' }).click();
    await expect(page).toHaveURL(/\/medallas\/hoja$/);
    await expect(page.locator('.sheet-page')).toHaveCount(2);
    await expect(page.locator('.medal-card')).toHaveCount(7);
    await expect(page.locator('.sheet-page').first().locator('.medal-card')).toHaveCount(6);
    // El nombre aparece también dentro del SVG de la medalla: se busca en el pie de la figura.
    await expect(page.locator('.medal-card figcaption b', { hasText: 'Hoja 7' })).toBeVisible();

    await page.emulateMedia({ media: 'print' });
    await expect(page.locator('header.watch')).toBeHidden();
    await expect(page.getByRole('button', { name: 'Imprimir / Guardar PDF' })).toBeHidden();

    const pdf = (await page.pdf({ format: 'A4', printBackground: true })).toString('latin1');
    const pages = pdf.match(/\/Type\s*\/Page[^s]/g) ?? [];
    expect(pages).toHaveLength(2);
  });
});
