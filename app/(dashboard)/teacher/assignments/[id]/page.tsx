import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { requireRole } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { GlassmorphicCard } from "@/components/shared/glassmorphic-card";
import { UserAvatar } from "@/components/shared/user-avatar";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { AttachmentList } from "@/components/shared/attachment-list";
import { GradeRow } from "./grade-row";

export const metadata: Metadata = { title: "Assignment" };

export default async function AssignmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole(["teacher"]);
  const { id } = await params;

  const assignment = await prisma.assignment.findFirst({
    where: { id, teacherId: user.id },
    include: {
      subject: true,
      schoolClass: true,
      section: true,
      submissions: {
        include: {
          student: {
            include: { user: { select: { firstName: true, lastName: true } } },
          },
        },
        orderBy: { submittedAt: "asc" },
      },
    },
  });
  if (!assignment) notFound();

  return (
    <div className="space-y-6">
      <GlassmorphicCard>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold">{assignment.title}</h1>
            <p className="text-sm text-muted-foreground">
              {assignment.subject.name} • {assignment.schoolClass.name}
              {assignment.section ? `-${assignment.section.name}` : ""} • due{" "}
              {format(assignment.dueDate, "d MMM yyyy, h:mm a")}
              {assignment.maxMarks &&
                ` • ${Number(assignment.maxMarks)} marks`}
            </p>
          </div>
          <Badge className="rounded-full bg-primary/12 text-primary">
            {assignment.submissions.length} submissions
          </Badge>
        </div>
        {assignment.description && (
          <p className="mt-3 rounded-2xl bg-secondary/60 p-4 text-sm">
            {assignment.description}
          </p>
        )}
        <AttachmentList urls={assignment.attachmentUrls} className="mt-3" />
      </GlassmorphicCard>

      <GlassmorphicCard>
        <h2 className="mb-4 text-lg">Submissions</h2>
        {assignment.submissions.length === 0 ? (
          <EmptyState title="No submissions yet" />
        ) : (
          <ul className="space-y-3">
            {assignment.submissions.map((s) => (
              <li
                key={s.id}
                className="rounded-2xl bg-secondary/60 p-4"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <UserAvatar
                    firstName={s.student.user.firstName}
                    lastName={s.student.user.lastName}
                    className="size-9"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">
                      {s.student.user.firstName} {s.student.user.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      submitted {format(s.submittedAt, "d MMM, h:mm a")}
                      {s.gradedAt && " • graded"}
                    </p>
                  </div>
                  <GradeRow
                    submissionId={s.id}
                    maxMarks={
                      assignment.maxMarks ? Number(assignment.maxMarks) : null
                    }
                    initialMarks={
                      s.marksObtained === null ? null : Number(s.marksObtained)
                    }
                    initialFeedback={s.feedback}
                  />
                </div>
                {s.content && (
                  <p className="mt-3 rounded-xl bg-card p-3 text-sm">
                    {s.content}
                  </p>
                )}
                <AttachmentList urls={s.attachmentUrls} className="mt-3" />
              </li>
            ))}
          </ul>
        )}
      </GlassmorphicCard>
    </div>
  );
}
