"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/shared/data-table";
import { UserAvatar } from "@/components/shared/user-avatar";
import { ImportDialog } from "@/components/forms/import-dialog";
import { importStudents } from "@/features/import/actions";

export interface StudentRow {
  id: string;
  admissionNo: string;
  firstName: string;
  lastName: string;
  email: string;
  className: string;
  rollNumber: number | null;
  isActive: boolean;
}

const columns: Column<StudentRow>[] = [
  {
    key: "name",
    header: "Student",
    sortable: true,
    accessor: (r) => `${r.firstName} ${r.lastName}`,
    cell: (r) => (
      <span className="flex items-center gap-2.5">
        <UserAvatar firstName={r.firstName} lastName={r.lastName} className="size-8" />
        <span>
          <span className="block font-semibold">
            {r.firstName} {r.lastName}
          </span>
          <span className="block text-xs text-muted-foreground">{r.email}</span>
        </span>
      </span>
    ),
  },
  {
    key: "admissionNo",
    header: "Admission No",
    sortable: true,
    accessor: (r) => r.admissionNo,
    cell: (r) => <span className="tabular-nums">{r.admissionNo}</span>,
  },
  {
    key: "className",
    header: "Class",
    sortable: true,
    accessor: (r) => r.className,
    cell: (r) => r.className,
  },
  {
    key: "roll",
    header: "Roll",
    sortable: true,
    accessor: (r) => r.rollNumber ?? 0,
    cell: (r) => r.rollNumber ?? "—",
  },
  {
    key: "status",
    header: "Status",
    accessor: (r) => (r.isActive ? "Active" : "Inactive"),
    cell: (r) =>
      r.isActive ? (
        <Badge className="rounded-full bg-success/15 text-success">Active</Badge>
      ) : (
        <Badge className="rounded-full bg-muted text-muted-foreground">
          Inactive
        </Badge>
      ),
  },
];

export function StudentsTable({ rows }: { rows: StudentRow[] }) {
  const router = useRouter();
  return (
    <DataTable
      rows={rows}
      columns={columns}
      getRowKey={(r) => r.id}
      searchPlaceholder="Search students by name, admission no, class..."
      pageSize={12}
      emptyTitle="No students found"
      onRowClick={(r) => router.push(`/admin/students/${r.id}`)}
      toolbar={
        <div className="flex flex-wrap gap-2">
          <ImportDialog
            title="Import students from a spreadsheet"
            description="Bulk-enrol students from Excel or CSV. Each student is created with the default password Student@123."
            templateHref="/api/templates/students"
            action={importStudents}
          />
          <Button asChild className="rounded-full">
            <Link href="/admin/students/new">
              <UserPlus className="size-4" />
              Add Student
            </Link>
          </Button>
        </div>
      }
    />
  );
}
