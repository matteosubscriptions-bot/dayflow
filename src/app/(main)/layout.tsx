import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/auth";
import { APP_NAME } from "@/lib/brand";
import { Logo } from "@/components/Logo";
import { NavMenu } from "@/components/NavMenu";
import { FloatingRecorder } from "@/components/FloatingRecorder";
import { OfflineBanner } from "@/components/OfflineBanner";
import { SyncQueue } from "@/components/SyncQueue";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-content flex-col px-5 pb-36 pt-4 sm:px-6">
      <header className="mb-8 flex items-center justify-between gap-3 border-b border-ink/10 pb-4">
        <Link href="/home" className="flex items-center gap-2.5">
          <Logo className="h-6 w-6" />
          <span className="label">{APP_NAME}</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/note/new" className="pill-solid pill-sm hidden sm:inline-flex">
            + Nuova nota
          </Link>
          <NavMenu />
        </div>
      </header>

      <OfflineBanner />
      <main className="flex-1">{children}</main>

      {/* Pulsante di registrazione flottante, disponibile in ogni schermata. */}
      <FloatingRecorder />
      <SyncQueue />
    </div>
  );
}
