// Curso en el que está el estudiante (tras /entrar). Persistido en este navegador.

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface CourseSession {
  id: string;
  name: string;
  joinCode: string;
  author: string;
}

interface CourseState {
  course: CourseSession | null;
  /** id local del robot → id de la fila publicada. */
  published: Record<string, string>;
  join: (c: CourseSession) => void;
  leave: () => void;
  markPublished: (localId: string, rowId: string) => void;
}

export const useCourse = create<CourseState>()(
  persist(
    (set) => ({
      course: null,
      published: {},
      join: (course) => set({ course }),
      leave: () => set({ course: null }),
      markPublished: (localId, rowId) =>
        set((s) => ({ published: { ...s.published, [localId]: rowId } })),
    }),
    { name: 'medalab.course.v1', storage: createJSONStorage(() => localStorage) },
  ),
);
