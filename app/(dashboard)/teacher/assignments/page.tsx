import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { ChevronRight, NotebookPen, Plus } from "lucide-react";
import { requireRole } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ModuleIcon } from "@/components/shared/module-icon";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata: Metadata = { title: "Assignments" };

export default async function TeacherAssignmentsPage() {
  const user = await requireRole(["teacher"]);

  const assignments = await prisma.assignment.findMany({
    where: { teacherId: user.id },
    include: {
      subject: true,
      schoolClass: true,
      section: true,
      submissions: { select: { id: true, gradedAt: true } },
    },
    orderBy: { dueDate: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Assignments</h1>
          <p className="text-sm text-muted-foreground">
            {assignments.length} assignments created
          </p>
        </div>
        <Button asChild className="rounded-full">
          <Link href="/teacher/assignments/new">
            <Plus className="size-4" />
            New Assignment
          </Link>
        </Button>
      </div>

      {assignments.length === 0 ? (
        <EmptyState
          title="No assignments yet"
          description="Create your first assignment for a class you teach."
        />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {assignments.map((a) => {
            const ungraded = a.submissions.filter((s) => !s.gradedAt).length;
            return (
              <Link
                key={a.id}
                href={`/teacher/assignments/${a.id}`}
                className="glass-strong flex items-center gap-4 rounded-3xl p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/10"
              >
                <ModuleIcon icon={NotebookPen} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-heading font-bold">{a.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.subject.name} • {a.schoolClass.name}
                    {a.section ? `-${a.section.name}` : ""} • due{" "}
                    {format(a.dueDate, "d MMM")}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge className="rounded-full bg-primary/12 text-primary">
                    {a.submissions.length} submitted
                  </Badge>
                  {ungraded > 0 && (
                    <Badge className="rounded-full bg-warning/15 text-warning">
                      {ungraded} to grade
                    </Badge>
                  )}
                  <ChevronRight className="size-4 text-muted-foreground" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
