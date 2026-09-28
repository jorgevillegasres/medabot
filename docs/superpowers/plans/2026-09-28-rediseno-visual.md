# Fase H · Rediseño visual — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Robots con arte «Medabot anime» (estilo A) y una interfaz «papel refinado» sin desbordes en celular, según `docs/superpowers/specs/2026-09-28-rediseno-visual-design.md`.

**Architecture:** El arte del robot vive en `packages/ui` (funciones puras que devuelven texto SVG); todos los consumidores siguen usando `robotSvg()`/`<RobotSvg>`, así el cambio llega a todas las pantallas. La interfaz se ajusta con tokens nuevos en `tokens.css`, CSS en `base.css`/`components.css`/`game.css` y cambios acotados en `App.tsx` (menú), `fields.tsx` (selector por pestañas), `Steps.tsx` (barra de progreso).

**Tech Stack:** TypeScript, React 18, Vite 6, Vitest, Playwright, pnpm workspaces. Sin librerías nuevas.

**Rama:** `fase-h-rediseno` (ya creada desde master).

**Reglas que no cambian:** no editar `packages/content/*.json` ni `packages/engine`; la medalla (`medalSvg`) sigue idéntica al MVP; UI en español; nada de Tailwind/MUI; animaciones solo con `transform`/`opacity`. Cada commit termina con la línea:

```
Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
```

**Comandos de verificación** (desde la raíz del repo):

- `pnpm test` (Vitest de todos los paquetes)
- `pnpm run typecheck`, `pnpm run lint`, `pnpm run format:check`
- `pnpm --filter @medalab/web exec playwright test <archivo>` (arranca Vite solo)

---

## Mapa de archivos

| Archivo                                                                                       | Acción    | Responsabilidad                                            |
| --------------------------------------------------------------------------------------------- | --------- | ---------------------------------------------------------- |
| `packages/ui/src/color.ts`                                                                    | Crear     | `shade()` y `tint()` para sombras y brillos                |
| `packages/ui/src/color.test.ts`                                                               | Crear     | Pruebas de color                                           |
| `packages/ui/src/robotArt.ts`                                                                 | Crear     | Dibujo de las 12 piezas + torso, `partSvg()`               |
| `packages/ui/src/svg.ts`                                                                      | Modificar | `robotSvg()` compone con `robotArt.ts`; `medalSvg` intacto |
| `packages/ui/src/svg.test.ts`                                                                 | Modificar | Reemplazar prueba de robot idéntico al MVP                 |
| `packages/ui/src/robotArt.test.ts`                                                            | Crear     | Pruebas del arte nuevo                                     |
| `packages/ui/src/RobotSvg.tsx`                                                                | Modificar | Añadir `<PartSvg>`                                         |
| `packages/ui/src/index.ts`                                                                    | Modificar | Exportar `PartSvg`, `partSvg`, `shade`, `tint`             |
| `apps/web/src/styles/tokens.css`                                                              | Modificar | Tokens nuevos de tipografía, espacio, radios               |
| `apps/web/src/styles/base.css`                                                                | Modificar | Tokens aplicados, `.sr-only`, cabecera                     |
| `apps/web/src/styles/components.css`                                                          | Modificar | Tokens aplicados, selector de piezas, pasos, escenario     |
| `apps/web/src/styles/game.css`                                                                | Modificar | Sello de acto oculto, HUD, estante                         |
| `apps/web/src/App.tsx`                                                                        | Modificar | Botón «Menú» en celular                                    |
| `apps/web/src/routes/Forge/fields.tsx`                                                        | Modificar | `PartsPicker` con pestañas y miniaturas                    |
| `apps/web/src/components/Steps.tsx`                                                           | Modificar | Barra de progreso «Acto N de 4 · Nombre»                   |
| `apps/web/src/routes/Forge/Forge.tsx`                                                         | Modificar | Pasar `noun` a `Steps`                                     |
| `apps/web/src/routes/{Gallery,Medals}.tsx`, `Forge/StepBody.tsx`, `Forge/scenes/Workshop.tsx` | Modificar | Clase `robot-stage` en el contenedor del robot             |
| `apps/web/e2e/helpers.ts`                                                                     | Modificar | `navTo()` (abre el menú en celular), `pickPart()`          |
| `apps/web/e2e/*.spec.ts`                                                                      | Modificar | Usar `navTo`/`pickPart` donde hoy se hace clic directo     |
| `apps/web/e2e/layout.spec.ts`                                                                 | Crear     | Sin desbordes a 375 px; menú accesible                     |
| `CLAUDE.md`                                                                                   | Modificar | Registrar la excepción del arte del robot                  |

---

### Task 1: Utilidades de color

**Files:**

- Create: `packages/ui/src/color.ts`
- Test: `packages/ui/src/color.test.ts`

- [ ] **Step 1: Escribir la prueba**

```ts
// packages/ui/src/color.test.ts
import { describe, expect, it } from 'vitest';
import { shade, tint } from './color';

describe('shade / tint', () => {
  it('oscurece hacia negro', () => {
    expect(shade('#FFFFFF', 0.25)).toBe('#BFBFBF');
    expect(shade('#2FB39A', 0)).toBe('#2FB39A');
    expect(shade('#2FB39A', 1)).toBe('#000000');
  });
  it('aclara hacia blanco', () => {
    expect(tint('#000000', 0.5)).toBe('#808080');
    expect(tint('#2FB39A', 1)).toBe('#FFFFFF');
  });
  it('acepta #rgb', () => {
    expect(shade('#fff', 0.25)).toBe('#BFBFBF');
  });
  it('ignora el canal alfa de #rrggbbaa y #rgba', () => {
    expect(shade('#FFFFFF80', 0.25)).toBe('#BFBFBF');
    expect(shade('#ffff', 0.25)).toBe('#BFBFBF');
  });
  it('recorta amount fuera de [0,1]', () => {
    expect(shade('#808080', -1)).toBe('#808080');
    expect(tint('#808080', 2)).toBe('#FFFFFF');
  });
  it('lanza con un color inválido', () => {
    expect(() => shade('red', 0.2)).toThrow();
  });
});
```

- [ ] **Step 2: Correr y ver que falla**

Run: `pnpm vitest run packages/ui/src/color.test.ts`
Expected: FAIL (`Cannot find module './color'`).

- [ ] **Step 3: Implementar**

```ts
// packages/ui/src/color.ts
// Sombras y brillos del arte del robot. Aceptan los mismos formatos que safeColor() deja pasar.

const HEX_RE = /^#([0-9A-Fa-f]{3,4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/;

function rgb(hex: string): [number, number, number] {
  if (!HEX_RE.test(hex)) throw new Error(`Color inválido: ${hex}`);
  let h = hex.slice(1);
  if (h.length <= 4) h = [...h.slice(0, 3)].map((c) => c + c).join('');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const toHex = (c: number[]) =>
  '#' +
  c
    .map((v) => Math.round(v).toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();

/** Mezcla el color con negro. amount 0 = igual, 1 = negro. */
export function shade(hex: string, amount: number): string {
  const a = clamp01(amount);
  return toHex(rgb(hex).map((v) => v * (1 - a)));
}

/** Mezcla el color con blanco. amount 0 = igual, 1 = blanco. */
export function tint(hex: string, amount: number): string {
  const a = clamp01(amount);
  return toHex(rgb(hex).map((v) => v + (255 - v) * a));
}
```

- [ ] **Step 4: Correr y ver que pasa**

Run: `pnpm vitest run packages/ui/src/color.test.ts`
Expected: PASS (6 tests). Nota: `0xFF * 0.75 = 191.25 → 191 = BF`; `0 + 255*0.5 = 127.5 → 128 = 80`.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/color.ts packages/ui/src/color.test.ts
git commit -m "feat(faseH): utilidades shade/tint para el arte del robot"
```

---

### Task 2: Arte del robot estilo A (lo ejecuta el controlador)

Esta tarea es de dirección de arte y requiere iterar mirando el resultado; la hace el controlador (no un subagente), con este contrato y estas pruebas.

**Files:**

- Create: `packages/ui/src/robotArt.ts`, `packages/ui/src/robotArt.test.ts`
- Modify: `packages/ui/src/svg.ts` (solo `robotSvg`), `packages/ui/src/svg.test.ts`, `packages/ui/src/RobotSvg.tsx`, `packages/ui/src/index.ts`, `CLAUDE.md`

**Contrato de `robotArt.ts`:**

```ts
export type Palette = { c: string; dark: string; light: string };
/** Fragmentos SVG (sin <svg>) en el lienzo 200×200 del robot. */
export function drawHead(opt: number, p: Palette): string;
export function drawArm(side: 'r' | 'l', opt: number, p: Palette): string; // 'r' = izquierda del dibujo
export function drawLegs(opt: number, p: Palette): string;
export function drawTorso(p: Palette): string;
export function palette(color: string): Palette; // dark = shade(c, .25), light = tint(c, .55)
/** Recorte (viewBox) de cada parte para las miniaturas. */
export const PART_BOX: Record<PartKey, string>;
/** Miniatura de una pieza: <svg viewBox=PART_BOX[part] aria-hidden="true" focusable="false">…</svg> */
export function partSvg(part: PartKey, option: number, color?: string): string;
```

`robotSvg(r)` en `svg.ts` queda: color seguro (`safeColor(r.color) || CATALOGS.colors[0]`), partes normalizadas (entero 0–2; si no, 0), y
`<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Robot ${esc(name)}">` + piernas + brazo r + brazo l + torso + cabeza, con `<g stroke="#1B1B2F" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">` envolviendo el dibujo. `partSvg` valida el color igual (`safeColor`) y usa `CATALOGS.colors[0]` si falta.

Referencia visual: el boceto A aprobado (domo con visor, mano articulada, escudo, bípedas) en `docs/superpowers/specs/2026-09-28-rediseno-visual-design.md` §1; tabla de piezas en el mismo documento.

- [ ] **Step 1: Pruebas nuevas** — crear `packages/ui/src/robotArt.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { CATALOGS, type PartKey } from '@medalab/content';
import { partSvg } from './robotArt';
import { robotSvg } from './svg';

const PARTS: PartKey[] = ['head', 'rarm', 'larm', 'legs'];

/** Etiquetas balanceadas: suficiente para detectar SVG roto al concatenar fragmentos. */
function wellFormed(svg: string): boolean {
  const stack: string[] = [];
  for (const m of svg.matchAll(/<(\/?)([a-zA-Z]+)\b[^>]*?(\/?)>/g)) {
    const [, close, tag, self] = m;
    if (self) continue;
    if (close) {
      if (stack.pop() !== tag) return false;
    } else stack.push(tag!);
  }
  return stack.length === 0;
}

const combo = (n: number) => ({
  head: n % 3,
  rarm: Math.floor(n / 3) % 3,
  larm: Math.floor(n / 9) % 3,
  legs: Math.floor(n / 27) % 3,
});

describe('robot estilo A', () => {
  it('las 81 combinaciones en los 7 colores producen SVG válido y pintado', () => {
    for (let n = 0; n < 81; n++)
      for (const color of CATALOGS.colors) {
        const s = robotSvg({ name: 'R', color, parts: combo(n) });
        expect(s.startsWith('<svg viewBox="0 0 200 200"')).toBe(true);
        expect(s).toContain('role="img"');
        expect(s).toContain(`fill="${color}"`);
        expect(wellFormed(s), `combo ${n} ${color}`).toBe(true);
      }
  });

  it('escapa el nombre', () => {
    const s = robotSvg({ name: `R&D <x> "y" 'z'`, color: '#2FB39A' });
    expect(s).toContain('aria-label="Robot R&amp;D &lt;x&gt; &quot;y&quot; &#39;z&#39;"');
    expect(s).not.toContain('<x>');
  });

  it('rechaza colores maliciosos', () => {
    const s = robotSvg({ name: 'R', color: '#fff" onload="alert(1)' });
    expect(s).not.toContain('onload');
    expect(s).toContain(`fill="${CATALOGS.colors[0]}"`);
  });

  it('cada opción de cada parte dibuja algo distinto', () => {
    for (const k of PARTS) {
      const out = [0, 1, 2].map((i) =>
        robotSvg({
          name: 'R',
          color: '#2FB39A',
          parts: { head: 0, rarm: 0, larm: 0, legs: 0, [k]: i },
        }),
      );
      expect(new Set(out).size, k).toBe(3);
    }
  });

  it('partes fuera de rango caen en la opción 0', () => {
    const base = robotSvg({ name: 'R', color: '#2FB39A', parts: combo(0) });
    const bad = robotSvg({
      name: 'R',
      color: '#2FB39A',
      parts: { head: 7, rarm: -1, larm: 1.5, legs: NaN } as never,
    });
    expect(bad).toBe(base);
  });

  it('sin partes ni color usa los valores por defecto', () => {
    expect(robotSvg({})).toBe(robotSvg({ name: '', color: CATALOGS.colors[0], parts: combo(0) }));
  });
});

describe('partSvg', () => {
  it('una miniatura decorativa por parte y opción', () => {
    for (const k of PARTS)
      for (let i = 0; i < 3; i++) {
        const s = partSvg(k, i, '#D8382E');
        expect(s.startsWith('<svg '), `${k}${i}`).toBe(true);
        expect(s).toContain('aria-hidden="true"');
        expect(s).not.toContain('role="img"');
        expect(wellFormed(s)).toBe(true);
      }
  });
  it('rechaza colores maliciosos', () => {
    expect(partSvg('head', 0, '#fff" onload="x')).not.toContain('onload');
  });
});
```

- [ ] **Step 2:** En `packages/ui/src/svg.test.ts`, quitar del `describe('SVG idénticos a los del MVP')` las aserciones de robot: en el `it.each` de fixtures dejar solo `expect(medalSvg(f.robot)).toBe(f.medalSvg);`, borrar el `it('las 81 combinaciones de medapartes…')`, y renombrar el `describe` a `'Medalla idéntica a la del MVP'`. Mantener la importación de `robotSvg` solo si otra prueba del archivo la usa; si no, quitarla.
- [ ] **Step 3:** Correr `pnpm vitest run packages/ui` → FAIL (falta `robotArt`).
- [ ] **Step 4:** Implementar `robotArt.ts` y el nuevo `robotSvg`. Actualizar el comentario de cabecera de `svg.ts`: «medalSvg() es un port fiel del MVP; robotSvg() usa el arte propio de la Fase H (robotArt.ts)».
- [ ] **Step 5:** Añadir a `RobotSvg.tsx`:

```tsx
import type { PartKey } from '@medalab/content';
import { partSvg } from './robotArt';

/** Miniatura decorativa de una medaparte: el nombre accesible lo pone el botón que la contiene. */
export function PartSvg({
  part,
  option,
  color,
}: {
  part: PartKey;
  option: number;
  color?: string;
}) {
  return (
    <span
      className="partsvg"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: partSvg(part, option, color) }}
    />
  );
}
```

y en `index.ts`: `export { RobotSvg, PartSvg } from './RobotSvg';`, `export { partSvg } from './robotArt';`, `export { shade, tint } from './color';`.

- [ ] **Step 6:** Correr `pnpm test` → PASS. Revisar visualmente: 81 combinaciones en una hoja HTML de scratchpad (no en el repo) a 200 px y a 40 px.
- [ ] **Step 7:** En `CLAUDE.md`, bajo «Estilo visual…», añadir: «Excepción (Fase H, decidida por el profesor): el dibujo del robot (packages/ui/src/robotArt.ts) es arte propio, no el del MVP. La medalla sí sigue idéntica al MVP.»
- [ ] **Step 8: Commit**

```bash
git add packages/ui CLAUDE.md
git commit -m "feat(faseH): robots con arte estilo Medabot anime y miniaturas de piezas"
```

---

### Task 3: Tokens de tipografía y espacio

**Files:**

- Modify: `apps/web/src/styles/tokens.css`, `apps/web/src/styles/base.css`, `apps/web/src/styles/components.css`, `apps/web/src/styles/game.css`

- [ ] **Step 1: Añadir tokens** al final del bloque `:root { … }` principal de `tokens.css` (no dentro de los bloques oscuros), con un comentario encima de los nuevos: `/* Fase H: escala tipográfica, espaciado y forma. */`

```css
--fs-xs: 0.8rem;
--fs-sm: 0.9rem;
--fs-md: 1rem;
--fs-lg: 1.2rem;
--fs-xl: clamp(1.4rem, 3.5vw, 2rem);
--fs-2xl: clamp(2rem, 6vw, 3.4rem);
--sp-1: 4px;
--sp-2: 8px;
--sp-3: 12px;
--sp-4: 16px;
--sp-5: 24px;
--sp-6: 32px;
--radius: 14px;
--radius-sm: 10px;
--bw: 3px;
--shadow: 5px 5px 0 var(--line);
--shadow-sm: 3px 3px 0 var(--line);
```

Cambiar el comentario de la primera línea a: `/* Tokens del MVP (colores sin cambios) + escala de la Fase H. */`

- [ ] **Step 2: Aplicar en `base.css`**
  - `h1 { font-size: var(--fs-2xl); }`; en `components.css`: `h2 { font-size: var(--fs-xl); }`, `h3 { font-size: var(--fs-lg); }`.
  - `.wrap { padding: 0 var(--sp-5) 80px; }` y añadir `@media (max-width: 480px) { .wrap { padding-left: var(--sp-4); padding-right: var(--sp-4); } .sheet { padding: var(--sp-4); } }`.
  - `.sheet { border: var(--bw) solid var(--line); border-radius: var(--radius); padding: var(--sp-5); box-shadow: var(--shadow); }`
  - Añadir:

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

- [ ] **Step 3: Sustitución mecánica en `components.css` y `game.css`:** cada `font-size` literal pasa al token más cercano (`0.75–0.85rem → --fs-xs`, `0.86–0.95rem → --fs-sm`, `1rem → --fs-md`, `1.05–1.3rem → --fs-lg`); cada `box-shadow: 4px 4px 0 var(--line)`/`6px 6px…` → `var(--shadow)`; `3px 3px 0 var(--line)` → `var(--shadow-sm)`; `border-radius` de tarjetas (12–14px) → `var(--radius)`, de controles (8–10px) → `var(--radius-sm)`. No tocar tamaños de la proyección (`.bout.big`, `.screen`, `.mosaic`) ni `print.css`.
- [ ] **Step 4: Verificar**

Run: `pnpm run lint && pnpm run format:check && pnpm --filter @medalab/web exec playwright test e2e/forge.spec.ts e2e/game.spec.ts`
Expected: todo en verde (el aspecto cambia poco; ninguna prueba depende de tamaños).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/styles
git commit -m "feat(faseH): escala tipográfica y de espacio en tokens"
```

---

### Task 4: Cabecera con menú en celular

**Files:**

- Modify: `apps/web/src/App.tsx`, `apps/web/src/styles/components.css`, `apps/web/e2e/helpers.ts`, specs que hacen clic en enlaces de la cabecera
- Create: `apps/web/e2e/layout.spec.ts`

- [ ] **Step 1: Prueba E2E** — crear `apps/web/e2e/layout.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

test.describe('cabecera', () => {
  test('en celular cabe en una línea y el menú abre y cierra', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'solo en celular');
    await page.goto('/');
    const header = page.locator('header.watch');
    expect((await header.boundingBox())!.height).toBeLessThan(80);
    const btn = page.getByRole('button', { name: 'Menú' });
    await expect(btn).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByRole('link', { name: 'Mis medallas' })).toBeHidden();
    await btn.click();
    await expect(btn).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Escape');
    await expect(btn).toHaveAttribute('aria-expanded', 'false');
    await expect(btn).toBeFocused();
    await btn.click();
    await page.getByRole('link', { name: 'Mis medallas' }).click();
    await expect(page).toHaveURL(/\/medallas$/);
    await expect(page.getByRole('link', { name: 'Mis medallas' })).toBeHidden();
  });

  test('en escritorio los enlaces están a la vista y no hay botón', async ({ page, isMobile }) => {
    test.skip(isMobile, 'solo en escritorio');
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Menú' })).toBeHidden();
    await expect(page.getByRole('link', { name: 'Mis medallas' })).toBeVisible();
  });
});
```

- [ ] **Step 2:** `pnpm --filter @medalab/web exec playwright test e2e/layout.spec.ts` → FAIL (no hay botón «Menú»).
- [ ] **Step 3: Implementar en `App.tsx`.** Importar `useEffect, useRef, useState` de react y `useLocation` de react-router-dom. Dentro de `App`:

```tsx
const [menu, setMenu] = useState(false);
const menuBtn = useRef<HTMLButtonElement>(null);
const { pathname } = useLocation();
useEffect(() => {
  setMenu(false);
}, [pathname]);
useEffect(() => {
  if (!menu) return;
  const onKey = (e: KeyboardEvent) => {
    if (e.key !== 'Escape') return;
    setMenu(false);
    menuBtn.current?.focus();
  };
  window.addEventListener('keydown', onKey);
  return () => window.removeEventListener('keydown', onKey);
}, [menu]);
```

En el JSX, entre la marca y el `<nav>`:

```tsx
          <button
            ref={menuBtn}
            type="button"
            className="menu-btn"
            aria-expanded={menu}
            aria-controls="menu-principal"
            onClick={() => setMenu((m) => !m)}
          >
            Menú
          </button>
          <nav id="menu-principal" aria-label="Principal" className={menu ? 'open' : undefined}>
```

Nota: el nombre accesible del botón es siempre «Menú» (el estado lo da `aria-expanded`). Confirmar en `main.tsx` que `App` está dentro del Router (si no, `useLocation` falla).

- [ ] **Step 4: CSS** al final de la sección «Navegación» de `components.css`:

```css
.menu-btn {
  display: none;
  margin-left: auto;
  background: transparent;
  color: var(--paper);
  border: 2px solid var(--paper);
  border-radius: var(--radius-sm);
  padding: 6px 14px;
  font-weight: 700;
}
@media (max-width: 719px) {
  .watch .wrap {
    flex-wrap: nowrap;
  }
  .menu-btn {
    display: inline-block;
  }
  .watch nav {
    display: none;
  }
  .watch nav.open {
    display: flex;
    flex-direction: column;
    gap: var(--sp-1);
    position: absolute;
    left: 0;
    right: 0;
    top: 100%;
    background: var(--ink);
    padding: var(--sp-2) var(--sp-4) var(--sp-4);
    border-bottom: 4px solid var(--yellow);
  }
  .watch nav.open a {
    padding: var(--sp-3);
  }
}
```

(`.watch` es `position: sticky`, así que es el contenedor del menú absoluto. En modo oscuro `--paper` es oscuro: si el botón no contrasta sobre `var(--ink)`, usar `#fbf6e6` literal como hace `.btn` con `#1b1b2f`.)

- [ ] **Step 5: Helper `navTo`** en `apps/web/e2e/helpers.ts`:

```ts
/** Sigue un enlace de la cabecera; en celular abre antes el menú. */
export async function navTo(page: Page, name: string | RegExp) {
  const btn = page.getByRole('button', { name: 'Menú' });
  if (await btn.isVisible()) await btn.click();
  await page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name }).click();
}
```

Buscar con `grep -n "getByRole('link'" apps/web/e2e/*.ts` los clics a enlaces **de la cabecera** (hoy: `forge.spec.ts` «Mis medallas», `game.spec.ts` «Forjar medalla», `arena.spec.ts` «Votar») y cambiarlos por `navTo(page, '…')`. No tocar enlaces que no son de la cabecera (p. ej. «Forjar mi medalla» de la portada, tarjetas de la galería, «Hoja para imprimir»).

- [ ] **Step 6:** Correr `pnpm --filter @medalab/web exec playwright test e2e/layout.spec.ts e2e/forge.spec.ts e2e/game.spec.ts e2e/print.spec.ts` → PASS.
- [ ] **Step 7: Commit**

```bash
git add apps/web/src/App.tsx apps/web/src/styles/components.css apps/web/e2e
git commit -m "feat(faseH): cabecera de una línea con menú en celular"
```

---

### Task 5: Selector de piezas por pestañas con miniaturas

**Files:**

- Modify: `apps/web/src/routes/Forge/fields.tsx` (`PartsPicker`), `apps/web/src/styles/components.css` (sección «Constructor»), `apps/web/src/styles/game.css` (`.shelf .partpick`), `apps/web/e2e/helpers.ts`, `apps/web/e2e/forge.spec.ts`, `apps/web/e2e/layout.spec.ts`

- [ ] **Step 1: Prueba E2E** — añadir a `layout.spec.ts`:

```ts
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
```

- [ ] **Step 2:** Correr → FAIL (no hay `tablist`).
- [ ] **Step 3: Implementar `PartsPicker`** en `fields.tsx` (importar `useId, useRef, useState` de react, `PartSvg` de `@medalab/ui`):

```tsx
const PART_TABS: { label: string; parts: PartKey[] }[] = [
  { label: 'Cabeza', parts: ['head'] },
  { label: 'Brazos', parts: ['rarm', 'larm'] },
  { label: 'Piernas', parts: ['legs'] },
];

export function PartsPicker({ onPick }: { onPick?: () => void }) {
  const { draft, setPart } = useDraft();
  const [tab, setTab] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const id = useId();
  const onKey = (e: React.KeyboardEvent) => {
    const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const n = (tab + d + PART_TABS.length) % PART_TABS.length;
    setTab(n);
    tabRefs.current[n]?.focus();
  };
  return (
    <div className="parts">
      <div className="part-tabs" role="tablist" aria-label="Medapartes" onKeyDown={onKey}>
        {PART_TABS.map((t, i) => (
          <button
            key={t.label}
            ref={(el) => {
              tabRefs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`${id}-t${i}`}
            aria-selected={tab === i}
            aria-controls={`${id}-p${i}`}
            tabIndex={tab === i ? 0 : -1}
            onClick={() => setTab(i)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {PART_TABS.map((t, i) => (
        <div
          key={t.label}
          role="tabpanel"
          id={`${id}-p${i}`}
          aria-labelledby={`${id}-t${i}`}
          hidden={tab !== i}
        >
          {t.parts.map((k) => (
            <div className="partpick" key={k} role="group" aria-label={CATALOGS.parts[k].n}>
              {t.parts.length > 1 && <b>{CATALOGS.parts[k].n}</b>}
              <div className="opts">
                {CATALOGS.parts[k].opts.map((o, j) => (
                  <button
                    type="button"
                    key={o}
                    className={draft.parts[k] === j ? 'on' : ''}
                    aria-pressed={draft.parts[k] === j}
                    onClick={() => {
                      setPart(k, j);
                      onPick?.();
                    }}
                  >
                    <PartSvg part={k} option={j} color={draft.color} />
                    <span>{o}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
```

(Si `React` no está importado como espacio de nombres en el archivo, usar `import type { KeyboardEvent } from 'react'` y tipar `e: KeyboardEvent`.)

- [ ] **Step 4: CSS.** En `components.css`, reemplazar las reglas `.parts`, `.partpick`, `.partpick .opts`, `.partpick .opts button`, `.partpick .opts button.on` por:

```css
.part-tabs {
  display: flex;
  gap: var(--sp-2);
  margin-bottom: var(--sp-3);
}
.part-tabs [role='tab'] {
  flex: 1;
  border: 2px solid var(--line);
  background: var(--card);
  color: var(--ink);
  border-radius: 999px;
  padding: 6px 10px;
  font-weight: 700;
  font-size: var(--fs-sm);
}
.part-tabs [role='tab'][aria-selected='true'] {
  background: var(--yellow);
  color: #1b1b2f;
}
.partpick + .partpick {
  margin-top: var(--sp-3);
}
.partpick b {
  display: block;
  margin-bottom: var(--sp-2);
  font-size: var(--fs-sm);
}
.partpick .opts {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--sp-2);
}
.partpick .opts button {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--sp-1);
  border: 2px solid var(--line);
  background: var(--card);
  border-radius: var(--radius-sm);
  padding: var(--sp-2) var(--sp-1);
  font-size: var(--fs-xs);
  font-weight: 600;
  line-height: 1.2;
  color: var(--ink);
  overflow-wrap: anywhere;
}
.partsvg {
  display: block;
  width: 56px;
  height: 56px;
}
.partsvg svg {
  display: block;
  width: 100%;
  height: 100%;
}
.partpick .opts button.on {
  border-width: 3px;
  background: color-mix(in srgb, var(--yellow) 30%, var(--card));
}
.partpick .opts button.on::after {
  content: '✓';
  position: absolute;
  top: -8px;
  right: -8px;
  width: 22px;
  height: 22px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--green);
  color: #fff;
  border: 2px solid var(--line);
  font-size: 12px;
  font-weight: 900;
}
```

En `game.css`, borrar la regla `.shelf .partpick { … }` si fija bordes/fondos que ya no aplican.

- [ ] **Step 5: Helper `pickPart`** en `helpers.ts`:

```ts
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
```

En `forge.spec.ts` reemplazar el bloque `.getByRole('group', { name: 'Piernas' }).getByRole('button', { name: 'Orugas' }).click()` por `await pickPart(page, 'Piernas', 'Orugas');`. Buscar con `grep -rn "getByRole('group'" apps/web/e2e` otros usos de grupos de piezas y hacer lo mismo.

- [ ] **Step 6:** `pnpm --filter @medalab/web exec playwright test e2e/layout.spec.ts e2e/forge.spec.ts e2e/game.spec.ts e2e/parity.spec.ts` → PASS.
- [ ] **Step 7: Commit**

```bash
git add apps/web/src apps/web/e2e
git commit -m "feat(faseH): selector de medapartes por pestañas con miniaturas"
```

---

### Task 6: Barra de progreso de la forja

**Files:**

- Modify: `apps/web/src/components/Steps.tsx`, `apps/web/src/routes/Forge/Forge.tsx`, `apps/web/src/styles/components.css` (sección «Pasos de la forja»), `apps/web/src/styles/game.css` (`.act-stamp`), `apps/web/e2e/layout.spec.ts`

- [ ] **Step 1: Prueba** — añadir a `layout.spec.ts`:

```ts
test('la forja muestra el acto actual', async ({ page }) => {
  await page.goto('/forja/1');
  const steps = page.getByRole('group', { name: 'Pasos de la forja' });
  await expect(steps).toContainText('Acto 1 de 4 · Taller');
  await expect(steps.locator('li[aria-current="step"]')).toHaveCount(1);
  await expect(page.getByRole('heading', { name: 'Acto 1 · El Taller' })).toBeAttached();
});
```

- [ ] **Step 2:** Correr → FAIL.
- [ ] **Step 3: `Steps.tsx`**

```tsx
const LABELS = ['1 · Cuerpo', '2 · Medalla', '3 · Test', '4 · Resultado'];
const bare = (l: string) => l.replace(/^\d+\s*·\s*/, '');

export function Steps({
  current,
  labels = LABELS,
  noun = 'Paso',
}: {
  current: number;
  labels?: string[];
  noun?: string;
}) {
  return (
    <div className="steps" role="group" aria-label="Pasos de la forja">
      <p className="steps-now">
        {noun} {current} de {labels.length} · {bare(labels[current - 1] ?? '')}
      </p>
      <ol>
        {labels.map((l, i) => {
          const n = i + 1;
          const cls = n < current ? 'done' : n === current ? 'on' : '';
          return (
            <li key={l} className={cls} aria-current={n === current ? 'step' : undefined}>
              <span>{bare(l)}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
```

En `Forge.tsx`: `<Steps current={step} labels={classic ? undefined : GAME_LABELS} noun={classic ? 'Paso' : 'Acto'} />`.

- [ ] **Step 4: CSS.** Reemplazar las reglas `.steps`, `.steps li`, `.steps li:last-child`, `.steps li.on`, `.steps li.done` de `components.css` por:

```css
.steps {
  margin: var(--sp-4) 0 var(--sp-5);
}
.steps-now {
  margin: 0 0 var(--sp-2);
  font-weight: 700;
  font-size: var(--fs-sm);
  color: var(--ink2);
}
.steps ol {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--sp-1);
  margin: 0;
  padding: 0;
  list-style: none;
}
.steps li {
  display: grid;
  gap: var(--sp-1);
  font-size: var(--fs-xs);
  font-weight: 600;
  color: var(--ink2);
}
.steps li::before {
  content: '';
  height: 8px;
  border-radius: 4px;
  background: var(--paper2);
  border: 2px solid var(--line);
}
.steps li.done::before {
  background: var(--red);
}
.steps li.on::before {
  background: var(--yellow);
}
.steps li.on {
  color: var(--ink);
}
@media (max-width: 719px) {
  .steps li span {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
  }
}
```

En `game.css`, `.act-stamp` pasa a oculto visualmente (el texto del acto ya lo muestra la barra); reemplazar sus declaraciones por las de `.sr-only` (mismo bloque que en `base.css`).

Buscar `grep -rn "\.steps\|act-stamp" apps/web/e2e` y ajustar pruebas que lean esos elementos (el `h2` sigue existiendo y es accesible).

- [ ] **Step 5:** `pnpm --filter @medalab/web exec playwright test e2e/layout.spec.ts e2e/forge.spec.ts e2e/game.spec.ts` → PASS.
- [ ] **Step 6: Commit**

```bash
git add apps/web/src apps/web/e2e
git commit -m "feat(faseH): barra de progreso de la forja por actos"
```

---

### Task 7: Escenario del robot, HUD y cero desbordes

**Files:**

- Modify: `apps/web/src/routes/Gallery.tsx`, `apps/web/src/routes/Medals.tsx`, `apps/web/src/routes/Forge/StepBody.tsx`, `apps/web/src/routes/Forge/scenes/Workshop.tsx`, `apps/web/src/styles/components.css`, `apps/web/src/styles/game.css`, `apps/web/e2e/layout.spec.ts`

- [ ] **Step 1: Prueba de desborde** — añadir a `layout.spec.ts` (importar `playToCity` de `./helpers`):

```ts
async function overflow(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const w = document.documentElement.clientWidth;
    const out: string[] = [];
    for (const el of document.querySelectorAll<HTMLElement>('main *')) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && (r.right > w + 1 || r.left < -1)) out.push(el.outerHTML.slice(0, 90));
    }
    for (const b of document.querySelectorAll<HTMLElement>('main button, main .btn')) {
      if (b.scrollWidth > b.clientWidth + 1) out.push('texto cortado: ' + b.textContent);
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
    await playToCity(page);
    expect(await overflow(page)).toEqual([]);
  });
});
```

(Si `playToCity` tiene otra firma, leerla en `helpers.ts` y adaptarse.)

- [ ] **Step 2:** Correr → anotar qué falla (se espera al menos el HUD o botones).
- [ ] **Step 3: Escenario.** Añadir la clase `robot-stage` al contenedor del robot: en `Gallery.tsx` y `Medals.tsx` `<RobotSvg robot={r} className="robot-stage" />`; en `StepBody.tsx` `<div className="preview robot-stage">`; en `Workshop.tsx` el `div` `bench-robot` recibe también `robot-stage` (conservar `spark` y la `key`). CSS en `components.css`:

```css
.robot-stage {
  display: block;
  background: var(--paper2);
  border: 2px solid var(--line);
  border-radius: var(--radius-sm);
  padding: var(--sp-2);
  background-image: radial-gradient(
    ellipse 38% 5% at 50% 94%,
    color-mix(in srgb, var(--ink) 18%, transparent) 97%,
    transparent 100%
  );
}
```

Revisar que `.preview` y `.bench-robot` no dupliquen bordes/fondos: si ya tienen, quitar los suyos.

- [ ] **Step 4: HUD.** En `game.css`, `.city-hud { flex-wrap: wrap; }` y `.city-hud b { flex: 1 1 8ch; min-width: 0; overflow-wrap: anywhere; }` (quitar `overflow: hidden`, `text-overflow`, `white-space: nowrap`).
- [ ] **Step 5:** Corregir cualquier otro desborde que reporte la prueba con CSS (preferir `min-width: 0`, `overflow-wrap: anywhere`, `flex-wrap: wrap`, columnas `minmax(0, 1fr)`). No cambiar textos.
- [ ] **Step 6:** Correr la suite E2E completa sin Supabase de profesor: `pnpm --filter @medalab/web exec playwright test e2e/layout.spec.ts e2e/forge.spec.ts e2e/game.spec.ts e2e/parity.spec.ts e2e/print.spec.ts` → PASS. Y `pnpm test && pnpm run typecheck && pnpm run lint && pnpm run format:check` → PASS.
- [ ] **Step 7: Commit**

```bash
git add apps/web/src apps/web/e2e
git commit -m "feat(faseH): escenario del robot, HUD sin cortes y cero desbordes en celular"
```

---

### Task 8: Capturas y cierre (controlador)

- [ ] **Step 1:** Capturas a 375 px y 1280 px de: portada, entrar, taller (cada pestaña), yunque, ciudad, encuentro, ceremonia, resultado, mis medallas, galería (DEMO-2045), votar. Guardarlas en el scratchpad (`…/scratchpad/faseH/`), no en el repo. Compararlas con las del pitch (`…/scratchpad/pitch/`).
- [ ] **Step 2:** Revisión final de código (subagente revisor) sobre `git diff master...fase-h-rediseno`.
- [ ] **Step 3:** Mostrar al profesor antes/después; aplicar ajustes que pida.
- [ ] **Step 4:** Commit final `feat(faseH): rediseño visual con robots estilo A e interfaz papel refinado` si quedan cambios, y usar superpowers:finishing-a-development-branch.
