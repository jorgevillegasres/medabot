// Estado del juego (no las respuestas: esas viven en store/draft.ts).
// Persistido para retomar la partida otro día (spec §2, reglas transversales).
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type Act = 1 | 2 | 3 | 4;

/** Etapas del Yunque: duelos, jerarquía, límite, rasgo, datos. */
export const ANVIL_STEPS = 5;

interface GameState {
  /** Último acto visitado: /forja retoma aquí. */
  act: Act;
  /** Etapa del Yunque, 0..ANVIL_STEPS-1. */
  anvilStep: number;
  /** Resultados de los duelos de principios (true = gana el primero). */
  duels: boolean[];
  /** Paso de la Ciudad (índice en citySteps); null = retomar en el primero pendiente. */
  cityStep: number | null;
  /** Animaciones ya vistas: "ceremonia:<robotId>". */
  seenUnlocks: string[];
  /** true = forja clásica (formulario). */
  classic: boolean;
  setAct: (act: Act) => void;
  setAnvilStep: (step: number) => void;
  setDuels: (duels: boolean[]) => void;
  setCityStep: (step: number) => void;
  markSeen: (key: string) => void;
  setClassic: (classic: boolean) => void;
  /** Nueva partida. Conserva la preferencia de modo. */
  reset: () => void;
}

const INITIAL = {
  act: 1 as Act,
  anvilStep: 0,
  duels: [] as boolean[],
  cityStep: null as number | null,
  seenUnlocks: [] as string[],
};

const isIndex = (n: unknown, max = Infinity): n is number =>
  Number.isInteger(n) && (n as number) >= 0 && (n as number) < max;

export const useGame = create<GameState>()(
  persist(
    (set) => ({
      ...INITIAL,
      classic: false,
      setAct: (act) => set({ act }),
      setAnvilStep: (anvilStep) => set({ anvilStep }),
      setDuels: (duels) => set({ duels }),
      setCityStep: (cityStep) => set({ cityStep }),
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
        anvilStep: s.anvilStep,
        duels: s.duels,
        cityStep: s.cityStep,
        seenUnlocks: s.seenUnlocks,
        classic: s.classic,
      }),
      // Tolerante a datos viejos o parciales (los E2E escriben solo { classic: true }).
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<GameState>;
        return {
          ...current,
          act: [1, 2, 3, 4].includes(p.act as number) ? (p.act as Act) : current.act,
          anvilStep: isIndex(p.anvilStep, ANVIL_STEPS) ? p.anvilStep : 0,
          duels: Array.isArray(p.duels) ? p.duels.filter((x) => typeof x === 'boolean') : [],
          cityStep: isIndex(p.cityStep) ? p.cityStep : null,
          seenUnlocks: Array.isArray(p.seenUnlocks)
            ? p.seenUnlocks.filter((x): x is string => typeof x === 'string')
            : [],
          classic: p.classic === true,
        };
      },
    },
  ),
);
