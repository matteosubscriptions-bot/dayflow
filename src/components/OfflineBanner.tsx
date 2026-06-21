"use client";

import { useAppStore } from "@/store/useAppStore";

export function OfflineBanner() {
  const isOnline = useAppStore((s) => s.isOnline);
  if (isOnline) return null;
  return (
    <div className="sticky top-0 z-40 bg-attention/90 px-4 py-1.5 text-center text-sm text-white">
      Offline — salvo tutto in locale
    </div>
  );
}
