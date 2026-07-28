import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { format, isPast } from "date-fns";
import { requireRole } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { GlassmorphicCard } from "@/components/shared/glassmorphic-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { SubmitDialog } from "./submit-dialog";

export const metadata: Metadata = { title: "Assignments" };

export default async function StudentAssignmentsPage() {
  const user = await requireRole(["student"]);
  if (!user.student?.sectionId) redirect("/student");

  const section = await prisma.section.findUnique({
    where: { id: user.student.sectionId },
    select: { classId: true },
  });
  const assignments = section
    ? await prisma.assignment.findMany({
        where: {
          classId: section.classId,
          OR: [{ sectionId: null }, { sectionId: user.student.sectionId }],
        },
        include: {
          subject: true,
          teacher: { select: { firstName: true, lastName: true } },
          submissions: { where: { studentId: user.student.id }, take: 1 },
        },
        orderBy: { dueDate: "desc" },
      })
    : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">Assignments</h1>
      {assignments.length === 0 ? (
        <EmptyState title="No assignments yet" />
      ) : (
        <div className="space-y-3">
          {assignments.map((a) => {
            const submission = a.submissions[0];
            const overdue = isPast(a.dueDate) && !submission;
            return (
              <GlassmorphicCard
                key={a.id}
                className="flex flex-wrap items-center gap-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-heading font-bold">{a.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.subject.name} • {a.teacher.firstName}{" "}
                    {a.teacher.lastName} • due{" "}
                    {format(a.dueDate, "d MMM, h:mm a")}
                    {a.maxMarks && ` • ${Number(a.maxMarks)} marks`}
                  </p>
                  {a.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-secondary-foreground">
                      {a.description}
                    </p>
                  )}
                  {submission?.feedback && (
                    <p className="mt-2 rounded-xl bg-success/10 px-3 py-2 text-xs">
                      <strong>Feedback:</strong> {submission.feedback}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {submission?.gradedAt ? (
                    <Badge className="rounded-full bg-success/15 text-success">
                      {Number(submission.marksObtained)}
                      {a.maxMarks && `/${Number(a.maxMarks)}`} graded
                    </Badge>
                  ) : submission ? (
                    <Badge className="rounded-full bg-info/15 text-info">
                      Submitted
                    </Badge>
                  ) : (
                    <Badge
                      className={
                        overdue
                          ? "rounded-full bg-destructive/15 text-destructive"
                          : "rounded-full bg-warning/15 text-warning"
                      }
                    >
                      {overdue ? "Overdue" : "Pending"}
                    </Badge>
                  )}
                  {!submission?.gradedAt && (
                    <SubmitDialog
                      assignmentId={a.id}
                      title={a.title}
                      existingContent={submission?.content}
                    />
                  )}
                </div>
              </GlassmorphicCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
