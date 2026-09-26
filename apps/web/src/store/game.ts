// Estado del juego (no las respuestas: esas viven en store/draft.ts).
// Persistido para retomar la partida otro día (spec §2, reglas transversales).
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { CIRCUITS, type CircuitKey } from '@medalab/content';

export type Act = 1 | 2 | 3 | 4;

interface GameState {
  /** Último acto visitado: /forja retoma aquí. */
  act: Act;
  /** Lugar con su panel abierto; null = viendo el mapa. */
  location: CircuitKey | null;
  /** Dónde está parado el robot en el mapa. */
  lastVisited: CircuitKey;
  /** Animaciones ya vistas: "unlock:<circuito>", "ceremonia:<robotId>". */
  seenUnlocks: string[];
  /** true = forja clásica (formulario). */
  classic: boolean;
  setAct: (act: Act) => void;
  goTo: (key: CircuitKey) => void;
  toMap: () => void;
  markSeen: (key: string) => void;
  setClassic: (classic: boolean) => void;
  /** Nueva partida. Conserva la preferencia de modo. */
  reset: () => void;
}

const INITIAL = {
  act: 1 as Act,
  location: null as CircuitKey | null,
  lastVisited: 'core' as CircuitKey,
  seenUnlocks: [] as string[],
};

const isCircuit = (k: unknown): k is CircuitKey => typeof k === 'string' && k in CIRCUITS;

export const useGame = create<GameState>()(
  persist(
    (set) => ({
      ...INITIAL,
      classic: false,
      setAct: (act) => set({ act }),
      goTo: (key) => set({ location: key, lastVisited: key }),
      toMap: () => set({ location: null }),
      markSeen: (key) =>
        set((s) => (s.seenUnlocks.includes(key) ? s : { seenUnlocks: [...s.seenUnlocks, key] })),
      setClassic: (classic) => set({ classic }),
      reset: () => set({ ...INITIAL }),
    }),
    {
      name: 'medalab.game.v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        act: s.act,
        location: s.location,
        lastVisited: s.lastVisited,
        seenUnlocks: s.seenUnlocks,
        classic: s.classic,
      }),
      // Tolerante a datos viejos o parciales (los E2E escriben solo { classic: true }).
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<GameState>;
        return {
          ...current,
          act: [1, 2, 3, 4].includes(p.act as number) ? (p.act as Act) : current.act,
          location: isCircuit(p.location) ? p.location : null,
          lastVisited: isCircuit(p.lastVisited) ? p.lastVisited : current.lastVisited,
          seenUnlocks: Array.isArray(p.seenUnlocks)
            ? p.seenUnlocks.filter((x): x is string => typeof x === 'string')
            : [],
          classic: p.classic === true,
        };
      },
    },
  ),
);
