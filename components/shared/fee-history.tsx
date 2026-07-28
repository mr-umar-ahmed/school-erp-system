import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";

export interface FeeHistoryRow {
  id: string;
  feeName: string;
  dueDate: string;
  amountDue: number;
  amountPaid: number;
  status: string;
  receiptNumber: string | null;
  paidDate: string | null;
  action?: React.ReactNode;
}

const STATUS_STYLE: Record<string, string> = {
  paid: "bg-success/15 text-success",
  partial: "bg-warning/15 text-warning",
  unpaid: "bg-destructive/15 text-destructive",
  overdue: "bg-destructive/15 text-destructive",
  waived: "bg-muted text-muted-foreground",
};

export function FeeHistory({ rows }: { rows: FeeHistoryRow[] }) {
  if (rows.length === 0) return <EmptyState title="No fee records" />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted-foreground">
            <th className="py-2 pr-4">Fee</th>
            <th className="py-2 pr-4">Due date</th>
            <th className="py-2 pr-4">Amount</th>
            <th className="py-2 pr-4">Paid</th>
            <th className="py-2 pr-4">Receipt</th>
            <th className="py-2 pr-4">Status</th>
            <th className="py-2" />
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-border/50">
              <td className="py-2.5 pr-4 font-medium">{r.feeName}</td>
              <td className="py-2.5 pr-4">
                {format(new Date(r.dueDate), "d MMM yyyy")}
              </td>
              <td className="py-2.5 pr-4 tabular-nums">
                ₹{r.amountDue.toLocaleString("en-IN")}
              </td>
              <td className="py-2.5 pr-4 tabular-nums">
                ₹{r.amountPaid.toLocaleString("en-IN")}
              </td>
              <td className="py-2.5 pr-4 text-xs text-muted-foreground">
                {r.receiptNumber ?? "—"}
              </td>
              <td className="py-2.5 pr-4">
                <Badge
                  className={`rounded-full ${STATUS_STYLE[r.status] ?? ""}`}
                >
                  {r.status}
                </Badge>
              </td>
              <td className="py-2.5">{r.action}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
