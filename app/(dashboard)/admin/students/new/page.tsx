import type { Metadata } from "next";
import { requireRole, institutionScope } from "@/lib/auth/dal";
import { getSectionOptions } from "@/features/academics/queries";
import { StudentForm } from "@/components/forms/student-form";

export const metadata: Metadata = { title: "Add Student" };

export default async function NewStudentPage() {
  const user = await requireRole(["super_admin", "admin", "staff"]);
  const sections = await getSectionOptions(institutionScope(user));

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold">Add Student</h1>
        <p className="text-sm text-muted-foreground">
          Enroll a new student and create their login.
        </p>
      </div>
      <StudentForm
        sections={sections.map((s) => ({ id: s.id, label: s.label }))}
      />
    </div>
  );
}
