// medalSvg() es un port fiel de medalSVG() del MVP (los tests lo comparan con el original).
// robotSvg() usa el arte propio de la Fase H (robotArt.ts), decidido por el profesor.

import { AXES, CATALOGS, type PartKey } from '@medalab/content';
import type { Profile } from '@medalab/engine';
import { drawRobot, FIT, normalizeParts, STROKE } from './robotArt';

export interface RobotLook {
  name?: string;
  color?: string;
  parts?: Record<PartKey, number>;
}

export interface MedalLook {
  name?: string;
  color?: string;
  serial?: string;
  profile?: Profile;
  compat?: number | null;
}

export function esc(s: unknown): string {
  return String(s).replace(
    /[&<>"']/g,
    (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]!,
  );
}

// Los robots importados vienen de códigos que cualquiera puede fabricar: los valores que
// el MVP interpolaba sin escapar solo pasan si tienen el formato esperado.
const COLOR_RE = /^#[0-9A-Fa-f]{3,8}$/;
const SERIAL_SAFE_RE = /^[A-Za-z0-9?-]{1,20}$/;
const safeColor = (c: unknown) => (typeof c === 'string' && COLOR_RE.test(c) ? c : '');
const safeSerial = (s: unknown) => (typeof s === 'string' && SERIAL_SAFE_RE.test(s) ? s : '');

export function robotSvg(r: RobotLook): string {
  const c = safeColor(r.color) || CATALOGS.colors[0]!;
  return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Robot ${esc(r.name || '')}"><g transform="${FIT}" ${STROKE}>${drawRobot(normalizeParts(r.parts), c)}</g></svg>`;
}

export function medalSvg(r: MedalLook): string {
  const prof: Profile = r.profile || { S: 60, O: 60, H: 60, P: 60, A: 60, L: 60 };
  const cx = 160,
    cy = 160,
    R = 92,
    ink = '#1B1B2F',
    paper = '#FBF6E6';
  const pts = AXES.map((a, i) => {
    const ang = -Math.PI / 2 + (i * Math.PI) / 3;
    const v = (prof[a.k] || 0) / 100;
    return [cx + Math.cos(ang) * R * v, cy + Math.sin(ang) * R * v];
  });
  const poly = pts.map((p) => p.join(',')).join(' ');
  const rings = [0.33, 0.66, 1]
    .map((f) => {
      const ps = AXES.map((_a, i) => {
        const ang = -Math.PI / 2 + (i * Math.PI) / 3;
        return [cx + Math.cos(ang) * R * f, cy + Math.sin(ang) * R * f].join(',');
      }).join(' ');
      return `<polygon points="${ps}" fill="none" stroke="${ink}" stroke-width="${f === 1 ? 2 : 1}" opacity="${f === 1 ? 1 : 0.35}"/>`;
    })
    .join('');
  const spokes = AXES.map((_a, i) => {
    const ang = -Math.PI / 2 + (i * Math.PI) / 3;
    return `<line x1="${cx}" y1="${cy}" x2="${cx + Math.cos(ang) * R}" y2="${cy + Math.sin(ang) * R}" stroke="${ink}" stroke-width="1" opacity=".35"/>`;
  }).join('');
  const labels = AXES.map((a, i) => {
    const ang = -Math.PI / 2 + (i * Math.PI) / 3;
    const x = cx + Math.cos(ang) * (R + 22),
      y = cy + Math.sin(ang) * (R + 22);
    return `<text x="${x}" y="${y + 5}" text-anchor="middle" font-size="15" font-weight="900" font-family="Archivo,Arial" fill="${ink}">${a.k}</text>`;
  }).join('');
  const hex = (rr: number) => {
    return [0, 1, 2, 3, 4, 5]
      .map((i) => {
        const ang = -Math.PI / 2 + (i * Math.PI) / 3 + Math.PI / 6;
        return [cx + Math.cos(ang) * rr, cy + Math.sin(ang) * rr].join(',');
      })
      .join(' ');
  };
  const color = safeColor(r.color) || '#F5C518';
  const serial = safeSerial(r.serial) || '???-00000';
  const compat = r.compat != null && Number.isFinite(Number(r.compat)) ? Number(r.compat) : null;
  const name = esc(r.name || 'Sin nombre');
  return `<svg viewBox="0 0 320 340" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Medalla de ${name}">
  <polygon points="${hex(152)}" fill="${ink}"/>
  <polygon points="${hex(144)}" fill="${color}" stroke="${ink}" stroke-width="3"/>
  <polygon points="${hex(126)}" fill="${paper}" stroke="${ink}" stroke-width="3"/>
  ${spokes}${rings}
  <polygon points="${poly}" fill="${color}" fill-opacity=".55" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/>
  ${pts.map((p) => `<circle cx="${p[0]}" cy="${p[1]}" r="4" fill="${ink}"/>`).join('')}
  ${labels}
  <text x="160" y="318" text-anchor="middle" font-size="18" font-weight="900" font-family="Archivo,Arial" fill="${ink}">${name}</text>
  <text x="160" y="336" text-anchor="middle" font-size="11" font-family="Menlo,monospace" fill="${ink}">${serial}${compat != null ? '  ·  compatibilidad ' + compat + '%' : ''}</text>
  </svg>`;
}
