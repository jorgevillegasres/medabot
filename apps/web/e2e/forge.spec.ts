import { expect, test } from '@playwright/test';
import { decodeCode, pattern } from './helpers';

const SHOTS = 'test-results/capturas';

test('forja completa: cuerpo → medalla → test → resultado', async ({ page }, info) => {
  const shot = (n: string) =>
    page.screenshot({ path: `${SHOTS}/${info.project.name}-${n}.png`, fullPage: true });

  await page.goto('/');
  await shot('0-inicio');
  await page.getByRole('link', { name: 'Forjar mi medalla' }).click();
  await expect(page).toHaveURL(/\/forja\/1$/);

  // Paso 1: el nombre es obligatorio.
  await page.getByRole('button', { name: 'Continuar a la medalla' }).click();
  await expect(page.getByRole('status')).toHaveText('Ponle nombre a tu robot antes de seguir.');
  await expect(page).toHaveURL(/\/forja\/1$/);

  await page.locator('#fName').fill('Centinela Kappa');
  await page.locator('#fAuthor').fill('Equipo 4');
  await page.locator('#fType').selectOption('GRD');
  await expect(page.getByText('Vigila espacios y hace cumplir reglas.')).toBeVisible();
  await page.getByRole('button', { name: 'El Estado' }).click();
  await page
    .getByRole('group', { name: 'Piernas' })
    .getByRole('button', { name: 'Orugas' })
    .click();
  await page.getByRole('button', { name: 'color #2B67C2' }).click();
  await expect(page.locator('.preview svg')).toBeVisible();
  await shot('1-cuerpo');

  // El borrador sobrevive a una recarga.
  await page.reload();
  await expect(page.locator('#fName')).toHaveValue('Centinela Kappa');
  await expect(page.locator('#fType')).toHaveValue('GRD');

  await page.getByRole('button', { name: 'Continuar a la medalla' }).click();
  await expect(page).toHaveURL(/\/forja\/2$/);

  // Paso 2: ordenar principios y límite obligatorio.
  await page.getByRole('button', { name: 'Subir Obediencia' }).click();
  await expect(page.locator('.rank li').first()).toHaveAttribute('data-axis', 'O');
  await page.getByRole('button', { name: 'Ir al test moral' }).click();
  await expect(page.getByRole('status')).toHaveText('Escribe el límite infranqueable de tu robot.');
  await page.locator('#fLimit').fill('No dejará pasar a nadie sin identificación.');
  await page.getByRole('button', { name: 'Rostros' }).click();
  await page.getByRole('button', { name: 'Ninguno' }).click();
  await expect(page.getByRole('button', { name: 'Rostros' })).toHaveAttribute(
    'aria-pressed',
    'false',
  );
  await shot('2-medalla');
  await page.getByRole('button', { name: 'Ir al test moral' }).click();

  // Paso 3: 10 dilemas del circuito Estado; opción y motivo son obligatorios.
  await expect(page.getByText(/entra al circuito Estado/)).toBeVisible();
  const dilemmas = page.locator('article.dilema');
  await expect(dilemmas).toHaveCount(10);
  const save = page.getByRole('button', { name: 'Grabar la medalla' });
  const pick = pattern(1);
  for (let i = 0; i < 10; i++) {
    await expect(save).toBeDisabled();
    const { option, reason } = pick(i);
    await dilemmas.nth(i).locator('.opt').nth(option).click();
    await expect(dilemmas.nth(i).locator('.why')).toBeVisible();
    await dilemmas
      .nth(i)
      .locator('.why button')
      .nth(reason - 1)
      .click();
  }
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '10');
  await shot('3-test');
  await save.click();

  // Paso 4: resultado.
  await expect(page).toHaveURL(/\/forja\/4$/);
  await expect(page.getByRole('heading', { name: 'Centinela Kappa' })).toBeVisible();
  await expect(page.getByText(/^GRD-\d{5} · Guardián · diseñado por Equipo 4$/)).toBeVisible();
  for (const m of [
    'Temperamento de la medalla',
    'Principio que más pesó',
    'Coherencia declarado / observado',
    'Compatibilidad medalla / tipo',
    'Evolución de la medalla',
    'Circuito recorrido',
  ]) {
    await expect(page.getByText(m)).toBeVisible();
  }
  const code = (await page.getByTestId('medal-code').textContent())!.trim();
  const robot = decodeCode(code);
  expect(robot.name).toBe('Centinela Kappa');
  expect(robot.type).toBe('GRD');
  expect(robot.schools).toBeUndefined();
  expect(Object.keys(robot.profile)).toEqual(['S', 'O', 'H', 'P', 'A', 'L']);

  // Lo que el estudiante no debe ver.
  const text = await page.locator('main').innerText();
  for (const hidden of [
    'Consecuencialista',
    'Deontológica',
    'De la virtud',
    'Del cuidado',
    'Kohlberg',
  ]) {
    expect(text).not.toContain(hidden);
  }
  await shot('4-resultado');

  // Descargar medalla PNG.
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Descargar medalla PNG' }).click();
  expect((await download).suggestedFilename()).toBe(`medalla-${robot.serial}.png`);

  // Queda en "Mis medallas" y se puede abrir.
  await page.getByRole('link', { name: 'Mis medallas' }).click();
  await page.getByRole('link', { name: /Centinela Kappa/ }).click();
  await expect(page.getByTestId('medal-code')).toHaveText(code);

  // "Forjar otra" limpia el borrador.
  await page.goto('/forja/4');
  await page.getByRole('button', { name: 'Forjar otra' }).click();
  await expect(page).toHaveURL(/\/forja\/1$/);
  await expect(page.locator('#fName')).toHaveValue('');
});

test('sin desbordamiento horizontal en ninguna pantalla', async ({ page }) => {
  for (const path of ['/', '/forja/1', '/medallas']) {
    await page.goto(path);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, path).toBeLessThanOrEqual(0);
  }
});

test('no se puede saltar pasos por URL', async ({ page }) => {
  await page.goto('/forja/3');
  await expect(page).toHaveURL(/\/forja\/1$/);
  await page.goto('/forja/9');
  await expect(page).toHaveURL(/\/forja\/1$/);
});
