import type { Metadata } from "next";
import { requireRole, institutionScope } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { PeopleTable } from "@/components/shared/people-table";

export const metadata: Metadata = { title: "Teachers" };

export default async function TeachersPage() {
  const user = await requireRole(["super_admin", "admin", "staff"]);
  const institutionId = institutionScope(user);

  const teachers = await prisma.teacher.findMany({
    where: { user: { institutionId } },
    include: { user: true },
    orderBy: { employeeId: "asc" },
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold">Teachers</h1>
        <p className="text-sm text-muted-foreground">
          {teachers.length} teaching staff
        </p>
      </div>
      <PeopleTable
        rows={teachers.map((t) => ({
          id: t.id,
          employeeId: t.employeeId,
          firstName: t.user.firstName,
          lastName: t.user.lastName,
          email: t.user.email,
          phone: t.user.phone,
          department: t.department,
          designation: t.designation,
          isActive: t.user.isActive,
        }))}
      />
    </div>
  );
}
