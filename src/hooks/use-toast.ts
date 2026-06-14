import { create } from 'zustand';

const DEFAULT_DURATION = 5000;

export type ToastType = 'default' | 'error' | 'success' | 'warning';

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  type?: ToastType;
  duration?: number;
}

interface ToastStore {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

let count = 0;

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = `toast-${count++}`;
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
    
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, toast.duration || DEFAULT_DURATION);
  },
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

export const toast = (props: Omit<Toast, 'id'>) => useToastStore.getState().addToast(props);
