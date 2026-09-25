// Código de medalla (PLAN.md §5.9): base64(utf8(JSON(robot sin schools))) sin relleno.
// Respaldo offline y formato de importación compatible con el MVP.

import { computeProfile } from './profile';
import type { Robot } from './types';

export function encode(obj: unknown): string {
  const bytes = new TextEncoder().encode(JSON.stringify(obj));
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/=+$/, '');
}

export function decode(code: string): unknown {
  const bin = atob(code.trim());
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
}

export function stripForCode(r: Robot): Omit<Robot, 'schools'> {
  const c: Partial<Robot> = Object.assign({}, r);
  delete c.schools;
  return c as Omit<Robot, 'schools'>;
}

export function medalCode(r: Robot): string {
  return encode(stripForCode(r));
}

/** Mismo criterio que addRobot() del MVP. */
function isRobotLike(r: unknown): r is Partial<Robot> {
  if (!r || typeof r !== 'object') return false;
  const x = r as Partial<Robot>;
  return !!x.name && !!x.profile && typeof x.answers === 'object' && !Array.isArray(x.answers);
}

export interface ImportOptions {
  /** Ids que ya existen: esos robots se omiten. */
  existingIds?: Iterable<string>;
  newId?: () => string;
}

/**
 * Importa códigos de medalla (uno por línea o separados por espacios) o un JSON exportado
 * (array de robots). Devuelve solo los robots válidos y nuevos, normalizados como en el MVP.
 */
export function importRobots(text: string, opts: ImportOptions = {}): Robot[] {
  const seen = new Set(opts.existingIds ?? []);
  const newId = opts.newId ?? (() => crypto.randomUUID());
  const txt = text.trim();
  let candidates: unknown[] = [];
  if (txt.startsWith('[')) {
    try {
      const parsed = JSON.parse(txt);
      if (Array.isArray(parsed)) candidates = parsed;
    } catch {
      return [];
    }
  } else {
    for (const c of txt.split(/\s+/).filter(Boolean)) {
      try {
        candidates.push(decode(c));
      } catch {
        /* código inválido: se ignora */
      }
    }
  }
  const out: Robot[] = [];
  for (const cand of candidates) {
    if (!isRobotLike(cand)) continue;
    const r = { ...cand } as Robot;
    if (!r.id) r.id = newId();
    if (seen.has(r.id)) continue;
    if (!r.schools) {
      try {
        r.schools = computeProfile(r).schools;
      } catch {
        continue;
      }
    }
    r.name = String(r.name).slice(0, 30);
    seen.add(r.id);
    out.push(r);
  }
  return out;
}
