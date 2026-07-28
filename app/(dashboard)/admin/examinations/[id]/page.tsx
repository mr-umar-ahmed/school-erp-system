import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { requireRole, institutionScope } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { ScheduleForm, PublishToggle } from "@/components/forms/exam-forms";
import { MarksEntry } from "@/components/forms/marks-entry";
import { GlassmorphicCard } from "@/components/shared/glassmorphic-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Examination" };

export default async function ExamDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ schedule?: string }>;
}) {
  const user = await requireRole(["super_admin", "admin"]);
  const institutionId = institutionScope(user);
  const { id } = await params;
  const { schedule: scheduleParam } = await searchParams;

  const exam = await prisma.examination.findFirst({
    where: { id, institutionId },
    include: {
      schedules: {
        include: {
          schoolClass: true,
          subject: true,
          _count: { select: { results: true } },
        },
        orderBy: [{ date: "asc" }],
      },
    },
  });
  if (!exam) notFound();

  const [classes, subjects] = await Promise.all([
    prisma.schoolClass.findMany({
      where: { institutionId },
      orderBy: { numericOrder: "asc" },
    }),
    prisma.subject.findMany({
      where: { institutionId },
      orderBy: { name: "asc" },
    }),
  ]);

  const selectedSchedule = exam.schedules.find((s) => s.id === scheduleParam);
  const roster = selectedSchedule
    ? await prisma.student.findMany({
        where: {
          section: { classId: selectedSchedule.classId },
          user: { isActive: true },
        },
        include: {
          user: { select: { firstName: true, lastName: true } },
          examResults: {
            where: { examScheduleId: selectedSchedule.id },
            take: 1,
          },
        },
        orderBy: [{ section: { name: "asc" } }, { rollNumber: "asc" }],
      })
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">{exam.name}</h1>
          <p className="text-sm text-muted-foreground">
            {exam.startDate && format(exam.startDate, "d MMM")} –{" "}
            {exam.endDate && format(exam.endDate, "d MMM yyyy")} •{" "}
            <span className="capitalize">{exam.type.replace("_", " ")}</span>
          </p>
        </div>
        <PublishToggle examinationId={exam.id} isPublished={exam.isPublished} />
      </div>

      <GlassmorphicCard>
        <h2 className="mb-3 text-lg">Add Subject Schedule</h2>
        <ScheduleForm
          examinationId={exam.id}
          classes={classes.map((c) => ({ id: c.id, name: c.name }))}
          subjects={subjects.map((s) => ({ id: s.id, name: s.name }))}
        />
      </GlassmorphicCard>

      <div className="grid gap-4 xl:grid-cols-3">
        <GlassmorphicCard>
          <h2 className="mb-3 text-lg">Schedules</h2>
          {exam.schedules.length === 0 ? (
            <EmptyState title="No subjects scheduled" />
          ) : (
            <ul className="space-y-2">
              {exam.schedules.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/admin/examinations/${exam.id}?schedule=${s.id}`}
                    className={cn(
                      "flex items-center justify-between gap-2 rounded-2xl px-4 py-2.5 text-sm transition-colors",
                      s.id === selectedSchedule?.id
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                        : "bg-secondary/60 hover:bg-accent"
                    )}
                  >
                    <span>
                      <span className="block font-semibold">
                        {s.schoolClass.name} — {s.subject.name}
                      </span>
                      <span
                        className={cn(
                          "text-xs",
                          s.id === selectedSchedule?.id
                            ? "text-primary-foreground/80"
                            : "text-muted-foreground"
                        )}
                      >
                        {format(s.date, "d MMM")} • {Number(s.totalMarks)} marks
                      </span>
                    </span>
                    <Badge
                      className={cn(
                        "rounded-full",
                        s._count.results > 0
                          ? "bg-success/15 text-success"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {s._count.results > 0 ? `${s._count.results} entered` : "pending"}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </GlassmorphicCard>

        <div className="xl:col-span-2">
          {selectedSchedule ? (
            <GlassmorphicCard>
              <h2 className="mb-3 text-lg">
                Marks — {selectedSchedule.schoolClass.name}{" "}
                {selectedSchedule.subject.name}
              </h2>
              <MarksEntry
                examScheduleId={selectedSchedule.id}
                totalMarks={Number(selectedSchedule.totalMarks)}
                rows={roster.map((st) => ({
                  studentId: st.id,
                  name: `${st.user.firstName} ${st.user.lastName}`,
                  rollNumber: st.rollNumber,
                  marks:
                    st.examResults[0]?.marksObtained === null ||
                    st.examResults[0]?.marksObtained === undefined
                      ? null
                      : Number(st.examResults[0].marksObtained),
                  isAbsent: st.examResults[0]?.isAbsent ?? false,
                }))}
              />
            </GlassmorphicCard>
          ) : (
            <EmptyState
              title="Pick a schedule"
              description="Select a class-subject schedule on the left to enter marks."
            />
          )}
        </div>
      </div>
    </div>
  );
}
