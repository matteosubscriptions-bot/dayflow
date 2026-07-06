import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { SettingsClient } from "@/components/SettingsClient";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const userId = (await getCurrentUserId())!;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, theme: true, textScale: true },
  });

  return (
    <SettingsClient
      email={user?.email ?? ""}
      initialTheme={(user?.theme as "light" | "dark") ?? "light"}
      initialScale={user?.textScale ?? 100}
    />
  );
}
