import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { AssignmentForm } from "@/components/forms/assignment-form";

export const metadata: Metadata = { title: "New Assignment" };

export default async function NewAssignmentPage() {
  const user = await requireRole(["teacher"]);
  const classSubjects = await prisma.classSubject.findMany({
    where: { teacherId: user.id },
    include: { schoolClass: true, subject: true },
    orderBy: { schoolClass: { numericOrder: "asc" } },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-extrabold">New Assignment</h1>
      <AssignmentForm
        classSubjects={classSubjects.map((cs) => ({
          id: cs.id,
          label: `${cs.schoolClass.name} — ${cs.subject.name}`,
        }))}
      />
    </div>
  );
}
