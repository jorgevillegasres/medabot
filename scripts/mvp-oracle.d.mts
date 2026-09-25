/* eslint-disable @typescript-eslint/no-explicit-any */
export const HTML_PATH: string;
export interface Mvp {
  AXES: any[];
  TYPES: any[];
  DILEMAS: any[];
  ARENA: any[];
  COLORS: string[];
  testFor(type: string): any[];
  computeProfile(draft: any): any;
  predict(robot: any, scenario: any, alt?: any): any;
  encode(obj: unknown): string;
  decode(code: string): any;
  stripForCode(robot: any): any;
  robotSVG(robot: any): string;
  medalSVG(robot: any): string;
}
export function loadMvp(html?: string): Mvp;
export function plain<T>(x: T): T;
