// Robots de este dispositivo (modo offline, paridad con la galería local del MVP).
// En la Fase 2 la galería del curso pasa a Supabase; esto queda como respaldo.

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Robot } from '@medalab/engine';

interface RobotsState {
  robots: Robot[];
  add: (r: Robot) => void;
  addMany: (rs: Robot[]) => void;
  update: (id: string, patch: Partial<Robot>) => void;
  remove: (id: string) => void;
}

export const useRobots = create<RobotsState>()(
  persist(
    (set) => ({
      robots: [],
      add: (r) =>
        set((s) => (s.robots.some((x) => x.id === r.id) ? s : { robots: [...s.robots, r] })),
      addMany: (rs) => set((s) => ({ robots: [...s.robots, ...rs] })),
      update: (id, patch) =>
        set((s) => ({ robots: s.robots.map((r) => (r.id === id ? { ...r, ...patch } : r)) })),
      remove: (id) => set((s) => ({ robots: s.robots.filter((x) => x.id !== id) })),
    }),
    {
      name: 'medalab.robots.v2',
      storage: createJSONStorage(() => localStorage),
      merge: (persisted, current) => {
        const p = persisted as Partial<RobotsState> | undefined;
        return Array.isArray(p?.robots) ? { ...current, robots: p.robots } : current;
      },
    },
  ),
);

export const useRobot = (id: string | null | undefined) =>
  useRobots((s) => (id ? s.robots.find((r) => r.id === id) : undefined));
