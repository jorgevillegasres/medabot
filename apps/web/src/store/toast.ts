import { create } from 'zustand';

interface ToastState {
  message: string;
  visible: boolean;
  show: (m: string) => void;
}

let timer: ReturnType<typeof setTimeout> | undefined;

export const useToast = create<ToastState>()((set) => ({
  message: '',
  visible: false,
  show: (message) => {
    clearTimeout(timer);
    set({ message, visible: true });
    timer = setTimeout(() => set({ visible: false }), 2200);
  },
}));

export const toast = (m: string) => useToast.getState().show(m);
