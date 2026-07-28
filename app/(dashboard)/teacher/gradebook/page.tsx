import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { requireRole, institutionScope } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { MarksEntry } from "@/components/forms/marks-entry";
import { GlassmorphicCard } from "@/components/shared/glassmorphic-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Gradebook" };

export default async function GradebookPage({
  searchParams,
}: {
  searchParams: Promise<{ schedule?: string }>;
}) {
  const user = await requireRole(["teacher"]);
  const institutionId = institutionScope(user);
  const { schedule: scheduleParam } = await searchParams;

  // Exam schedules for class-subjects this teacher teaches.
  const myClassSubjects = await prisma.classSubject.findMany({
    where: { teacherId: user.id },
    select: { classId: true, subjectId: true },
  });
  const schedules = await prisma.examSchedule.findMany({
    where: {
      examination: { institutionId },
      OR: myClassSubjects.map((cs) => ({
        classId: cs.classId,
        subjectId: cs.subjectId,
      })),
    },
    include: {
      examination: true,
      schoolClass: true,
      subject: true,
      _count: { select: { results: true } },
    },
    orderBy: { date: "desc" },
  });

  const selected = schedules.find((s) => s.id === scheduleParam);
  const roster = selected
    ? await prisma.student.findMany({
        where: {
          section: { classId: selected.classId },
          user: { isActive: true },
        },
        include: {
          user: { select: { firstName: true, lastName: true } },
          examResults: { where: { examScheduleId: selected.id }, take: 1 },
        },
        orderBy: [{ section: { name: "asc" } }, { rollNumber: "asc" }],
      })
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Gradebook</h1>
        <p className="text-sm text-muted-foreground">
          Enter exam marks for the subjects you teach.
        </p>
      </div>

      {myClassSubjects.length === 0 ? (
        <EmptyState title="No subjects assigned to you yet" />
      ) : (
        <div className="grid gap-4 xl:grid-cols-3">
          <GlassmorphicCard>
            <h2 className="mb-3 text-lg">My Exam Schedules</h2>
            {schedules.length === 0 ? (
              <EmptyState title="No exams scheduled yet" />
            ) : (
              <ul className="space-y-2">
                {schedules.map((s) => (
                  <li key={s.id}>
                    <Link
                      href={`/teacher/gradebook?schedule=${s.id}`}
                      className={cn(
                        "flex items-center justify-between gap-2 rounded-2xl px-4 py-2.5 text-sm transition-colors",
                        s.id === selected?.id
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
                            s.id === selected?.id
                              ? "text-primary-foreground/80"
                              : "text-muted-foreground"
                          )}
                        >
                          {s.examination.name} • {format(s.date, "d MMM")}
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
                        {s._count.results > 0 ? "entered" : "pending"}
                      </Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </GlassmorphicCard>

          <div className="xl:col-span-2">
            {selected ? (
              <GlassmorphicCard>
                <h2 className="mb-3 text-lg">
                  {selected.examination.name} — {selected.schoolClass.name}{" "}
                  {selected.subject.name}
                </h2>
                <MarksEntry
                  examScheduleId={selected.id}
                  totalMarks={Number(selected.totalMarks)}
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
                title="Pick an exam schedule"
                description="Select a schedule on the left to enter marks."
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
