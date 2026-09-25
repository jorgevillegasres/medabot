// Borrador de la forja. Persiste en localStorage para que el estudiante no pierda el trabajo.

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { AXIS_KEYS, CATALOGS, type PartKey } from '@medalab/content';
import type { Draft } from '@medalab/engine';

export function newDraft(): Draft {
  // Mismos valores iniciales que newDraft() del MVP.
  return {
    name: '',
    author: '',
    type: 'CST',
    purpose: '',
    principal: 'Una persona',
    parts: { head: 0, rarm: 0, larm: 0, legs: 0 },
    color: CATALOGS.colors[0],
    rank: [...AXIS_KEYS],
    limit: '',
    trait: 'Protector',
    data: [],
    retention: '',
    answers: {},
    reasons: {},
  };
}

interface DraftState {
  draft: Draft;
  /** Id del último robot grabado desde este borrador (paso 4). */
  forgedId: string | null;
  set: (patch: Partial<Draft>) => void;
  setPart: (k: PartKey, i: number) => void;
  moveRank: (from: number, to: number) => void;
  toggleData: (v: string) => void;
  answer: (dilemmaId: string, option: number) => void;
  reason: (dilemmaId: string, stage: number) => void;
  setForged: (id: string) => void;
  reset: () => void;
}

const isValidDraft = (d: unknown): d is Draft => {
  if (!d || typeof d !== 'object') return false;
  const x = d as Draft;
  return (
    typeof x.answers === 'object' &&
    !Array.isArray(x.answers) &&
    typeof x.reasons === 'object' &&
    Array.isArray(x.rank) &&
    x.rank.length === 6 &&
    typeof x.parts === 'object'
  );
};

export const useDraft = create<DraftState>()(
  persist(
    (set) => ({
      draft: newDraft(),
      forgedId: null,
      set: (patch) => set((s) => ({ draft: { ...s.draft, ...patch } })),
      setPart: (k, i) =>
        set((s) => ({ draft: { ...s.draft, parts: { ...s.draft.parts, [k]: i } } })),
      moveRank: (from, to) =>
        set((s) => {
          const rank = [...s.draft.rank];
          const [x] = rank.splice(from, 1);
          rank.splice(to, 0, x);
          return { draft: { ...s.draft, rank } };
        }),
      toggleData: (v) =>
        set((s) => {
          // Como en el MVP: "Ninguno" excluye a los demás.
          let data = s.draft.data;
          if (v === 'Ninguno') data = ['Ninguno'];
          else {
            data = data.filter((x) => x !== 'Ninguno');
            data = data.includes(v) ? data.filter((x) => x !== v) : [...data, v];
          }
          return { draft: { ...s.draft, data } };
        }),
      answer: (id, option) =>
        set((s) => ({ draft: { ...s.draft, answers: { ...s.draft.answers, [id]: option } } })),
      reason: (id, stage) =>
        set((s) => ({ draft: { ...s.draft, reasons: { ...s.draft.reasons, [id]: stage } } })),
      setForged: (id) => set({ forgedId: id }),
      reset: () => set({ draft: newDraft(), forgedId: null }),
    }),
    {
      name: 'medalab.draft.v2',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ draft: s.draft, forgedId: s.forgedId }),
      merge: (persisted, current) => {
        const p = persisted as Partial<DraftState> | undefined;
        if (!p || !isValidDraft(p.draft)) return current;
        return { ...current, draft: { ...newDraft(), ...p.draft }, forgedId: p.forgedId ?? null };
      },
    },
  ),
);
