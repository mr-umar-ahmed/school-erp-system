import type { Metadata } from "next";
import { requireRole, institutionScope } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { StudentsTable } from "./students-table";

export const metadata: Metadata = { title: "Students" };

export default async function StudentsPage() {
  const user = await requireRole(["super_admin", "admin", "staff"]);
  const institutionId = institutionScope(user);

  const students = await prisma.student.findMany({
    where: { user: { institutionId } },
    include: {
      user: true,
      section: { include: { schoolClass: true } },
    },
    orderBy: { admissionNo: "asc" },
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold">Students</h1>
        <p className="text-sm text-muted-foreground">
          {students.length} students enrolled
        </p>
      </div>
      <StudentsTable
        rows={students.map((s) => ({
          id: s.id,
          admissionNo: s.admissionNo,
          firstName: s.user.firstName,
          lastName: s.user.lastName,
          email: s.user.email,
          className: s.section
            ? `${s.section.schoolClass.name}-${s.section.name}`
            : "—",
          rollNumber: s.rollNumber,
          isActive: s.user.isActive,
        }))}
      />
    </div>
  );
}
