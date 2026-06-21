import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/auth";
import { checkAbsence } from "@/lib/absence";
import { BottomNav } from "@/components/BottomNav";
import { QuickCapture } from "@/components/QuickCapture";
import { OfflineBanner } from "@/components/OfflineBanner";
import { WelcomeBack } from "@/components/WelcomeBack";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const absence = await checkAbsence(userId);

  return (
    <div className="min-h-dvh pb-24">
      <OfflineBanner />
      {absence.showWelcomeBack && (
        <WelcomeBack days={absence.days} allowGoalRedefine={Boolean(absence.allowGoalRedefine)} />
      )}
      <main className="mx-auto max-w-content px-6 py-6 md:px-8">{children}</main>
      <QuickCapture />
      <BottomNav />
    </div>
  );
}
