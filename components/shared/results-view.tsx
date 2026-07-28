import { Badge } from "@/components/ui/badge";
import { GlassmorphicCard } from "@/components/shared/glassmorphic-card";
import { ProgressRing } from "@/components/shared/progress-ring";
import { EmptyState } from "@/components/shared/empty-state";
import type { ExamReport } from "@/features/examinations/queries";
import { cn } from "@/lib/utils";

/** Report-card style view of published exam results. */
export function ResultsView({ reports }: { reports: ExamReport[] }) {
  if (reports.length === 0) {
    return (
      <EmptyState
        title="No published results yet"
        description="Results appear here once the school publishes them."
      />
    );
  }
  return (
    <div className="space-y-4">
      {reports.map((report) => (
        <GlassmorphicCard key={report.examId}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg">{report.examName}</h2>
              <p className="text-sm text-muted-foreground">
                {report.obtained} / {report.totalMarks} marks overall
              </p>
            </div>
            <ProgressRing value={report.percentage} label="scored" size={72} strokeWidth={6} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="py-2 pr-4">Subject</th>
                  <th className="py-2 pr-4">Marks</th>
                  <th className="py-2 pr-4">Grade</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {report.subjects.map((s, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="py-2 pr-4 font-medium">{s.subject}</td>
                    <td className="py-2 pr-4 tabular-nums">
                      {s.isAbsent ? "Absent" : `${s.marks ?? "—"} / ${s.total}`}
                    </td>
                    <td className="py-2 pr-4">
                      {s.grade ? (
                        <Badge className="rounded-full bg-primary/12 text-primary">
                          {s.grade}
                        </Badge>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-2">
                      <span
                        className={cn(
                          "text-xs font-bold",
                          s.isAbsent
                            ? "text-muted-foreground"
                            : s.passed
                              ? "text-success"
                              : "text-destructive"
                        )}
                      >
                        {s.isAbsent ? "AB" : s.passed ? "Pass" : "Fail"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassmorphicCard>
      ))}
    </div>
  );
}
