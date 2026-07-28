import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { ChevronRight, FileSpreadsheet } from "lucide-react";
import { requireRole, institutionScope } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { ExamForm } from "@/components/forms/exam-forms";
import { GlassmorphicCard } from "@/components/shared/glassmorphic-card";
import { ModuleIcon } from "@/components/shared/module-icon";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata: Metadata = { title: "Examinations" };

export default async function ExaminationsPage() {
  const user = await requireRole(["super_admin", "admin"]);
  const institutionId = institutionScope(user);

  const exams = await prisma.examination.findMany({
    where: { institutionId },
    orderBy: { startDate: "desc" },
    include: { _count: { select: { schedules: true } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Examinations</h1>
        <p className="text-sm text-muted-foreground">
          Create exams, schedule subjects, enter marks and publish results.
        </p>
      </div>

      <GlassmorphicCard>
        <h2 className="mb-3 text-lg">New Examination</h2>
        <ExamForm />
      </GlassmorphicCard>

      {exams.length === 0 ? (
        <EmptyState title="No examinations yet" />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {exams.map((exam) => (
            <Link
              key={exam.id}
              href={`/admin/examinations/${exam.id}`}
              className="glass-strong flex items-center gap-4 rounded-3xl p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/10"
            >
              <ModuleIcon icon={FileSpreadsheet} />
              <div className="min-w-0 flex-1">
                <p className="font-heading font-bold">{exam.name}</p>
                <p className="text-xs text-muted-foreground">
                  {exam.startDate && format(exam.startDate, "d MMM")}
                  {exam.endDate && ` – ${format(exam.endDate, "d MMM yyyy")}`} •{" "}
                  {exam._count.schedules} schedules
                </p>
              </div>
              <Badge
                className={
                  exam.isPublished
                    ? "rounded-full bg-success/15 text-success"
                    : "rounded-full bg-warning/15 text-warning"
                }
              >
                {exam.isPublished ? "Published" : "Draft"}
              </Badge>
              <ChevronRight className="size-4 text-muted-foreground" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
