import dynamic from "next/dynamic";

// Come la home: tutta client-side (Web Speech, localStorage), niente SSR
// per evitare mismatch di hydration sulle API del browser.
const StatusView = dynamic(() => import("@/components/StatusView"), { ssr: false });

export const metadata = { title: "Stato — Officina & Specchio" };

export default function StatusPage() {
  return <StatusView />;
}
