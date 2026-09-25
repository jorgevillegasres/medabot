// Port fiel de robotSVG() y medalSVG() del MVP. Producen exactamente el mismo texto SVG
// (los tests lo comparan con el original), así la pantalla y la exportación coinciden.

import { AXES, CATALOGS, type PartKey } from '@medalab/content';
import type { Profile } from '@medalab/engine';

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
  const c = safeColor(r.color) || CATALOGS.colors[0],
    p = r.parts || { head: 0, rarm: 0, larm: 0, legs: 0 };
  const ink = '#1B1B2F',
    st = '#C9CED4';
  let head = '',
    legs = '';
  // cabezas
  if (p.head === 0)
    head = `<path d="M100 38 L88 8 L100 26 L112 8 Z" fill="${c}" stroke="${ink}" stroke-width="3"/><rect x="72" y="36" width="56" height="40" rx="10" fill="${c}" stroke="${ink}" stroke-width="3"/><rect x="82" y="50" width="36" height="12" rx="3" fill="#2FB39A" stroke="${ink}" stroke-width="3"/>`;
  if (p.head === 1)
    head = `<path d="M70 76 a30 30 0 0 1 60 0 Z" fill="${c}" stroke="${ink}" stroke-width="3"/><rect x="72" y="58" width="56" height="12" rx="6" fill="#2FB39A" stroke="${ink}" stroke-width="3"/>`;
  if (p.head === 2)
    head = `<line x1="100" y1="36" x2="100" y2="12" stroke="${ink}" stroke-width="3"/><circle cx="100" cy="10" r="6" fill="#D8382E" stroke="${ink}" stroke-width="3"/><rect x="74" y="36" width="52" height="40" rx="4" fill="${c}" stroke="${ink}" stroke-width="3"/><circle cx="90" cy="56" r="6" fill="#2FB39A" stroke="${ink}" stroke-width="3"/><circle cx="110" cy="56" r="6" fill="#2FB39A" stroke="${ink}" stroke-width="3"/>`;
  // torso + medalla en espalda (se ve el borde)
  const torso = `<rect x="68" y="80" width="64" height="62" rx="8" fill="${st}" stroke="${ink}" stroke-width="3"/><rect x="88" y="92" width="24" height="38" rx="4" fill="${c}" stroke="${ink}" stroke-width="3"/><circle cx="100" cy="111" r="7" fill="#F5C518" stroke="${ink}" stroke-width="3"/>`;
  // brazos (lado derecho del robot = izquierda del dibujo)
  const arm = (dir: number, kind: number, shield: boolean) => {
    const ax = dir < 0 ? 36 : 134;
    if (kind === 0 && shield)
      return `<rect x="${ax}" y="82" width="28" height="56" rx="6" fill="${c}" stroke="${ink}" stroke-width="3"/><line x1="${ax + 14}" y1="92" x2="${ax + 14}" y2="128" stroke="${ink}" stroke-width="3"/>`;
    if (kind === 0)
      return `<rect x="${ax}" y="84" width="30" height="18" rx="4" fill="${st}" stroke="${ink}" stroke-width="3"/><rect x="${ax + 4}" y="100" width="22" height="42" rx="4" fill="${c}" stroke="${ink}" stroke-width="3"/><circle cx="${ax + 15}" cy="142" r="7" fill="${ink}"/>`;
    if (kind === 1)
      return `<rect x="${ax + 4}" y="84" width="22" height="40" rx="4" fill="${st}" stroke="${ink}" stroke-width="3"/><path d="M${ax + 4} 124 l-6 20 l10 -6 M${ax + 26} 124 l6 20 l-10 -6" fill="${c}" stroke="${ink}" stroke-width="3"/>`;
    return `<rect x="${ax + 6}" y="84" width="18" height="44" rx="6" fill="${st}" stroke="${ink}" stroke-width="3"/><rect x="${ax + 2}" y="128" width="26" height="16" rx="5" fill="${c}" stroke="${ink}" stroke-width="3"/>`;
  };
  const rarm = arm(-1, p.rarm, false),
    larm = arm(1, p.larm, p.larm === 0);
  if (p.legs === 0)
    legs = `<rect x="74" y="144" width="20" height="44" rx="5" fill="${c}" stroke="${ink}" stroke-width="3"/><rect x="106" y="144" width="20" height="44" rx="5" fill="${c}" stroke="${ink}" stroke-width="3"/><rect x="68" y="184" width="30" height="12" rx="4" fill="${ink}"/><rect x="102" y="184" width="30" height="12" rx="4" fill="${ink}"/>`;
  if (p.legs === 1)
    legs = `<rect x="56" y="150" width="88" height="34" rx="17" fill="${ink}"/><rect x="62" y="156" width="76" height="22" rx="11" fill="${st}" stroke="${ink}" stroke-width="3"/><circle cx="76" cy="167" r="5" fill="${c}"/><circle cx="100" cy="167" r="5" fill="${c}"/><circle cx="124" cy="167" r="5" fill="${c}"/>`;
  if (p.legs === 2)
    legs = `<rect x="84" y="142" width="32" height="24" fill="${st}" stroke="${ink}" stroke-width="3"/><circle cx="78" cy="176" r="16" fill="${ink}"/><circle cx="122" cy="176" r="16" fill="${ink}"/><circle cx="78" cy="176" r="6" fill="${c}"/><circle cx="122" cy="176" r="6" fill="${c}"/>`;
  return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Robot ${esc(r.name || '')}">${legs}${rarm}${larm}${torso}${head}</svg>`;
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
