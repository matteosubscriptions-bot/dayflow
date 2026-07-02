import dynamic from "next/dynamic";

// L'app è interamente client-side (voce, coda offline, stato locale);
// il server è API + persistenza.
const AppShell = dynamic(() => import("@/components/AppShell"), { ssr: false });

export default function Page() {
  return <AppShell />;
}
