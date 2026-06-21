import { create } from "zustand";
import type { QuickCaptureType } from "@/types";

interface AppState {
  quickCaptureOpen: boolean;
  quickCaptureType: QuickCaptureType;
  isOnline: boolean;
  openQuickCapture: (type?: QuickCaptureType) => void;
  closeQuickCapture: () => void;
  setOnline: (online: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  quickCaptureOpen: false,
  quickCaptureType: "idea",
  isOnline: true,
  openQuickCapture: (type = "idea") =>
    set({ quickCaptureOpen: true, quickCaptureType: type }),
  closeQuickCapture: () => set({ quickCaptureOpen: false }),
  setOnline: (online) => set({ isOnline: online }),
}));
