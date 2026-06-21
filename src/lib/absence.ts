import { differenceInCalendarDays } from "date-fns";
import { prisma } from "@/lib/prisma";
import type { AbsenceInfo } from "@/types";

/** Detects whether the user has been away long enough to surface welcome-back. */
export async function checkAbsence(userId: string): Promise<AbsenceInfo> {
  const last = await prisma.checkIn.findFirst({
    where: { userId, completedAt: { not: null } },
    orderBy: { completedAt: "desc" },
  });

  if (!last?.completedAt) return { isAbsent: false, days: 0 };

  const days = differenceInCalendarDays(new Date(), last.completedAt);
  if (days >= 5) {
    return {
      isAbsent: true,
      days,
      showWelcomeBack: true,
      allowGoalRedefine: days >= 30,
    };
  }
  return { isAbsent: false, days };
}
