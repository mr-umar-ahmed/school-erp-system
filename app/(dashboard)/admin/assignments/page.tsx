import type { Metadata } from "next";
import { format } from "date-fns";
import { requireRole, institutionScope } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { GlassmorphicCard } from "@/components/shared/glassmorphic-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Assignments" };

export default async function AdminAssignmentsPage() {
  const user = await requireRole(["super_admin", "admin"]);
  const institutionId = institutionScope(user);

  const assignments = await prisma.assignment.findMany({
    where: { institutionId },
    include: {
      subject: true,
      schoolClass: true,
      section: true,
      teacher: { select: { firstName: true, lastName: true } },
      _count: { select: { submissions: true } },
    },
    orderBy: { dueDate: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Assignments</h1>
        <p className="text-sm text-muted-foreground">
          All homework and assignments across the school.
        </p>
      </div>

      <GlassmorphicCard>
        {assignments.length === 0 ? (
          <EmptyState title="No assignments created yet" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="py-2 pr-4">Assignment</th>
                  <th className="py-2 pr-4">Class</th>
                  <th className="py-2 pr-4">Teacher</th>
                  <th className="py-2 pr-4">Due</th>
                  <th className="py-2">Submissions</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((a) => (
                  <tr key={a.id} className="border-b border-border/50">
                    <td className="py-2.5 pr-4">
                      <span className="block font-medium">{a.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {a.subject.name}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4">
                      {a.schoolClass.name}
                      {a.section ? `-${a.section.name}` : ""}
                    </td>
                    <td className="py-2.5 pr-4">
                      {a.teacher.firstName} {a.teacher.lastName}
                    </td>
                    <td className="py-2.5 pr-4 text-xs">
                      {format(a.dueDate, "d MMM yyyy")}
                    </td>
                    <td className="py-2.5">
                      <Badge className="rounded-full bg-primary/12 text-primary">
                        {a._count.submissions}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassmorphicCard>
    </div>
  );
}
