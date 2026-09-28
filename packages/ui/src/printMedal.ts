// Medalla para imprimir (PLAN.md Fase 4): el mismo SVG de pantalla, con la fuente incrustada
// para que se vea idéntica fuera del navegador (imprenta, acrílico, cartulina).

import { medalSvg, type MedalLook } from './svg';

/** Ancho de impresión; el alto sale de la proporción 320:340 de la medalla → 2550 px. */
export const PRINT_WIDTH = 2400;

const WOFF2_DATA_URL = /^data:font\/woff2;base64,[A-Za-z0-9+/]+=*$/;

/**
 * SVG de la medalla con Archivo 900 incrustada como @font-face.
 * @param fontDataUrl `data:font/woff2;base64,…` (se valida: no se interpola nada más).
 */
export function printableMedalSvg(r: MedalLook, fontDataUrl: string): string {
  if (!WOFF2_DATA_URL.test(fontDataUrl))
    throw new Error('Fuente inválida: se espera un data URL woff2');
  const style =
    `<defs><style>@font-face{font-family:'Archivo';font-weight:900;font-style:normal;` +
    `src:url(${fontDataUrl}) format('woff2');}</style></defs>`;
  return medalSvg(r).replace(/^(<svg[^>]*>)/, `$1${style}`);
}
