import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/dal";
import { StudentTransportCard } from "@/components/shared/transport-card";

export const metadata: Metadata = { title: "Transport" };

export default async function StudentTransportPage() {
  const user = await requireRole(["student"]);
  if (!user.student) redirect("/student");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">My Transport</h1>
      <StudentTransportCard studentId={user.student.id} />
    </div>
  );
}
