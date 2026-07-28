"use client";

import { useState, useTransition } from "react";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { saveMarks } from "@/features/examinations/actions";

export interface MarksRow {
  studentId: string;
  name: string;
  rollNumber: number | null;
  marks: number | null;
  isAbsent: boolean;
}

/** Spreadsheet-style marks entry for one exam schedule. */
export function MarksEntry({
  examScheduleId,
  totalMarks,
  rows,
}: {
  examScheduleId: string;
  totalMarks: number;
  rows: MarksRow[];
}) {
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState(rows);

  const update = (studentId: string, patch: Partial<MarksRow>) =>
    setData((d) =>
      d.map((r) => (r.studentId === studentId ? { ...r, ...patch } : r))
    );

  const save = () => {
    startTransition(async () => {
      const result = await saveMarks({
        examScheduleId,
        entries: data.map((r) => ({
          studentId: r.studentId,
          marks: r.isAbsent ? null : r.marks,
          isAbsent: r.isAbsent,
        })),
      });
      if (result.error) toast.error(result.error);
      if (result.success) toast.success(result.success);
    });
  };

  return (
    <div className="space-y-4">
      <div className="glass-strong overflow-x-auto rounded-2xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-4 py-2.5">Roll</th>
              <th className="px-4 py-2.5">Student</th>
              <th className="px-4 py-2.5">Marks / {totalMarks}</th>
              <th className="px-4 py-2.5">Absent</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.studentId} className="border-b border-border/50">
                <td className="px-4 py-1.5 font-bold text-muted-foreground tabular-nums">
                  {row.rollNumber ?? "—"}
                </td>
                <td className="px-4 py-1.5 font-medium">{row.name}</td>
                <td className="px-4 py-1.5">
                  <Input
                    type="number"
                    min={0}
                    max={totalMarks}
                    step={0.5}
                    disabled={row.isAbsent}
                    value={row.marks ?? ""}
                    onChange={(e) =>
                      update(row.studentId, {
                        marks:
                          e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                    className="h-8 w-24 tabular-nums"
                  />
                </td>
                <td className="px-4 py-1.5">
                  <Checkbox
                    checked={row.isAbsent}
                    onCheckedChange={(v) =>
                      update(row.studentId, { isAbsent: v === true })
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Button onClick={save} disabled={isPending} className="rounded-full">
        <Save className="size-4" />
        {isPending ? "Saving..." : "Save Marks"}
      </Button>
    </div>
  );
}
