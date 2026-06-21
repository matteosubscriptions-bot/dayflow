import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ReportDashboard } from "@/components/ReportDashboard";
import type { ReportContent } from "@/lib/reports";

export default async function ReportDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const report = await prisma.report.findFirst({
    where: { id: params.id, userId },
  });
  if (!report) notFound();

  const content: ReportContent | null = report.contentJson
    ? JSON.parse(report.contentJson)
    : null;

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <Link href="/reports" className="btn-ghost text-sm">
        ← Report
      </Link>
      <header>
        <p className="meta">
          {report.periodStart.toLocaleDateString("it-IT")} –{" "}
          {report.periodEnd.toLocaleDateString("it-IT")}
        </p>
        <h1 className="mt-1 font-display text-3xl capitalize">{report.type}</h1>
      </header>

      {report.narrative && (
        <div className="rounded-card bg-low/10 p-5">
          <p className="whitespace-pre-line font-display leading-relaxed">
            {report.narrative}
          </p>
        </div>
      )}

      {content && <ReportDashboard content={content} />}
    </div>
  );
}
