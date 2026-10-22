import { create } from 'zustand';

interface UIState {
  hasUnsavedChanges: boolean;
  setHasUnsavedChanges: (val: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  hasUnsavedChanges: false,
  setHasUnsavedChanges: (val) => set({ hasUnsavedChanges: val }),
}));