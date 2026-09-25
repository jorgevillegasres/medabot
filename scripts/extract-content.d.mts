export function extract(html: string): Record<string, unknown>;
export function stringify(value: unknown, indent?: string): string;
export function render(content: Record<string, unknown>): Record<string, string>;
export function renderDoc(content: Record<string, unknown>): string;
/** Ruta absoluta → texto esperado de cada archivo generado. */
export function buildAll(html?: string): Record<string, string>;
