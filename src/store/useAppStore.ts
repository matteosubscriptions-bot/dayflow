"use client";

import { create } from "zustand";

interface AppState {
  recorderOpen: boolean;
  openRecorder: () => void;
  closeRecorder: () => void;
  online: boolean;
  setOnline: (v: boolean) => void;
  pendingSync: number;
  setPendingSync: (n: number) => void;
}

export const useAppStore = create<AppState>((set) => ({
  recorderOpen: false,
  openRecorder: () => set({ recorderOpen: true }),
  closeRecorder: () => set({ recorderOpen: false }),
  online: true,
  setOnline: (v) => set({ online: v }),
  pendingSync: 0,
  setPendingSync: (n) => set({ pendingSync: n }),
}));
