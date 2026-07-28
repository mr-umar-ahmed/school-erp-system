"use client";

import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/shared/data-table";
import { UserAvatar } from "@/components/shared/user-avatar";

export interface PersonRow {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  department: string | null;
  designation: string | null;
  isActive: boolean;
}

const columns: Column<PersonRow>[] = [
  {
    key: "name",
    header: "Name",
    sortable: true,
    accessor: (r) => `${r.firstName} ${r.lastName}`,
    cell: (r) => (
      <span className="flex items-center gap-2.5">
        <UserAvatar
          firstName={r.firstName}
          lastName={r.lastName}
          className="size-8"
        />
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
    key: "employeeId",
    header: "Employee ID",
    sortable: true,
    accessor: (r) => r.employeeId,
    cell: (r) => <span className="tabular-nums">{r.employeeId}</span>,
  },
  {
    key: "department",
    header: "Department",
    sortable: true,
    accessor: (r) => r.department ?? "",
    cell: (r) => r.department ?? "—",
  },
  {
    key: "designation",
    header: "Designation",
    accessor: (r) => r.designation ?? "",
    cell: (r) => r.designation ?? "—",
  },
  {
    key: "phone",
    header: "Phone",
    accessor: (r) => r.phone ?? "",
    cell: (r) => <span className="text-xs">{r.phone ?? "—"}</span>,
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

export function PeopleTable({ rows }: { rows: PersonRow[] }) {
  return (
    <DataTable
      rows={rows}
      columns={columns}
      getRowKey={(r) => r.id}
      searchPlaceholder="Search by name, department, employee ID..."
      pageSize={12}
      emptyTitle="No records found"
    />
  );
}
