import type { Metadata } from "next";
import { requireRole, institutionScope } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { PeopleTable } from "@/components/shared/people-table";

export const metadata: Metadata = { title: "Staff" };

export default async function StaffPage() {
  const user = await requireRole(["super_admin", "admin"]);
  const institutionId = institutionScope(user);

  const staff = await prisma.staff.findMany({
    where: { user: { institutionId } },
    include: { user: true },
    orderBy: { employeeId: "asc" },
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold">Staff</h1>
        <p className="text-sm text-muted-foreground">
          {staff.length} non-teaching staff
        </p>
      </div>
      <PeopleTable
        rows={staff.map((s) => ({
          id: s.id,
          employeeId: s.employeeId,
          firstName: s.user.firstName,
          lastName: s.user.lastName,
          email: s.user.email,
          phone: s.user.phone,
          department: s.department,
          designation: s.designation,
          isActive: s.user.isActive,
        }))}
      />
    </div>
  );
}
