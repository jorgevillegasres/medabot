/** Número de serie como en el MVP: TIPO-NNNNN con NNNNN en 10000..99998 (PLAN.md §5.7). */
export function makeSerial(type: string, rand: () => number = Math.random): string {
  return type + '-' + String(10000 + Math.floor(rand() * 89999));
}

export const SERIAL_RE = /^[A-Z]{3}-\d{5}$/;
