"use client";

import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/shared/data-table";
import { CollectFeeDialog } from "@/components/forms/collect-fee-dialog";

export interface DueRow {
  id: string;
  studentName: string;
  className: string;
  feeName: string;
  dueDate: string; // ISO
  amountDue: number;
  amountPaid: number;
  status: string;
}

const columns: Column<DueRow>[] = [
  {
    key: "student",
    header: "Student",
    sortable: true,
    accessor: (r) => r.studentName,
    cell: (r) => (
      <span>
        <span className="block font-semibold">{r.studentName}</span>
        <span className="text-xs text-muted-foreground">{r.className}</span>
      </span>
    ),
  },
  {
    key: "fee",
    header: "Fee",
    accessor: (r) => r.feeName,
    cell: (r) => r.feeName,
  },
  {
    key: "due",
    header: "Due date",
    sortable: true,
    accessor: (r) => r.dueDate,
    cell: (r) => format(new Date(r.dueDate), "d MMM yyyy"),
  },
  {
    key: "outstanding",
    header: "Outstanding",
    sortable: true,
    accessor: (r) => r.amountDue - r.amountPaid,
    cell: (r) => (
      <span className="font-bold tabular-nums">
        ₹{(r.amountDue - r.amountPaid).toLocaleString("en-IN")}
      </span>
    ),
  },
  {
    key: "status",
    header: "Status",
    accessor: (r) => r.status,
    cell: (r) => (
      <Badge
        className={
          r.status === "partial"
            ? "rounded-full bg-warning/15 text-warning"
            : "rounded-full bg-destructive/15 text-destructive"
        }
      >
        {r.status}
      </Badge>
    ),
  },
  {
    key: "actions",
    header: "",
    cell: (r) => (
      <CollectFeeDialog
        feePaymentId={r.id}
        studentName={r.studentName}
        feeName={r.feeName}
        outstanding={r.amountDue - r.amountPaid}
      />
    ),
  },
];

export function DuesTable({ rows }: { rows: DueRow[] }) {
  return (
    <DataTable
      rows={rows}
      columns={columns}
      getRowKey={(r) => r.id}
      searchPlaceholder="Search dues by student, class..."
      pageSize={10}
      emptyTitle="No outstanding dues 🎉"
    />
  );
}
