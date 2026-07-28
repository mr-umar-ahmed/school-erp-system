import type { Metadata } from "next";
import Link from "next/link";
import { School, Users } from "lucide-react";
import { requireRole } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { GlassmorphicCard } from "@/components/shared/glassmorphic-card";
import { ModuleIcon } from "@/components/shared/module-icon";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "My Classes" };

export default async function MyClassesPage() {
  const user = await requireRole(["teacher"]);

  const [classSubjects, sections] = await Promise.all([
    prisma.classSubject.findMany({
      where: { teacherId: user.id },
      include: {
        schoolClass: { include: { sections: { include: { _count: { select: { students: true } } } } } },
        subject: true,
      },
      orderBy: { schoolClass: { numericOrder: "asc" } },
    }),
    prisma.section.findMany({
      where: { classTeacherId: user.id },
      include: {
        schoolClass: true,
        _count: { select: { students: true } },
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">My Classes</h1>

      {sections.length > 0 && (
        <GlassmorphicCard>
          <h2 className="mb-3 text-lg">Class Teacher Of</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sections.map((s) => (
              <Link
                key={s.id}
                href={`/teacher/attendance?section=${s.id}`}
                className="flex items-center gap-3 rounded-2xl bg-secondary/60 p-4 transition-colors hover:bg-accent"
              >
                <ModuleIcon icon={School} size="sm" />
                <div>
                  <p className="font-semibold">
                    {s.schoolClass.name}-{s.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {s._count.students} students
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </GlassmorphicCard>
      )}

      <GlassmorphicCard>
        <h2 className="mb-3 text-lg">Subjects I Teach</h2>
        {classSubjects.length === 0 ? (
          <EmptyState title="No subjects assigned yet" />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {classSubjects.map((cs) => {
              const students = cs.schoolClass.sections.reduce(
                (sum, sec) => sum + sec._count.students,
                0
              );
              return (
                <div key={cs.id} className="rounded-2xl bg-secondary/60 p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{cs.subject.name}</p>
                    <Badge className="rounded-full bg-primary/12 text-primary">
                      {cs.schoolClass.name}
                    </Badge>
                  </div>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="size-3" />
                    {students} students across{" "}
                    {cs.schoolClass.sections.length} sections
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </GlassmorphicCard>
    </div>
  );
}
