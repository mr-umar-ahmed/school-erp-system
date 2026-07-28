import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/dal";
import { getPublishedResults } from "@/features/examinations/queries";
import { ResultsView } from "@/components/shared/results-view";

export const metadata: Metadata = { title: "My Results" };

export default async function StudentResultsPage() {
  const user = await requireRole(["student"]);
  if (!user.student) redirect("/student");
  const reports = await getPublishedResults(user.student.id);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">My Results</h1>
      <ResultsView reports={reports} />
    </div>
  );
}
