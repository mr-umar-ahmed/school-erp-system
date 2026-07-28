import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { requireRole, institutionScope } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { getSectionOptions } from "@/features/academics/queries";
import { getStudentSnapshot } from "@/features/dashboard/queries";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/shared/user-avatar";
import { ProgressRing } from "@/components/shared/progress-ring";
import { GlassmorphicCard } from "@/components/shared/glassmorphic-card";
import { EmptyState } from "@/components/shared/empty-state";
import { StudentForm } from "@/components/forms/student-form";

export const metadata: Metadata = { title: "Student Profile" };

export default async function StudentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole(["super_admin", "admin", "staff"]);
  const institutionId = institutionScope(user);
  const { id } = await params;

  const student = await prisma.student.findFirst({
    where: { id, user: { institutionId } },
    include: {
      user: true,
      section: { include: { schoolClass: true } },
      parentLinks: {
        include: { parent: { include: { user: true } } },
      },
      feePayments: {
        orderBy: { dueDate: "desc" },
        take: 12,
        include: { feeStructure: true },
      },
    },
  });
  if (!student) notFound();

  const [snapshot, sections] = await Promise.all([
    getStudentSnapshot(student.id),
    getSectionOptions(institutionId),
  ]);

  return (
    <div className="space-y-6">
      <GlassmorphicCard className="flex flex-wrap items-center gap-5">
        <UserAvatar
          firstName={student.user.firstName}
          lastName={student.user.lastName}
          avatarUrl={student.user.avatarUrl}
          className="size-16 text-lg"
        />
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-extrabold">
            {student.user.firstName} {student.user.lastName}
          </h1>
          <p className="text-sm text-muted-foreground">
            {student.admissionNo} •{" "}
            {student.section
              ? `${student.section.schoolClass.name}-${student.section.name}`
              : "No class"}{" "}
            • Roll {student.rollNumber ?? "—"}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <Badge className="rounded-full bg-primary/12 text-primary">
              {student.admissionStatus}
            </Badge>
            {student.bloodGroup && (
              <Badge className="rounded-full bg-destructive/10 text-destructive">
                {student.bloodGroup}
              </Badge>
            )}
            {!student.user.isActive && (
              <Badge className="rounded-full bg-muted text-muted-foreground">
                Inactive
              </Badge>
            )}
          </div>
        </div>
        {snapshot && (
          <ProgressRing value={snapshot.attendancePercent} label="attendance" size={84} />
        )}
      </GlassmorphicCard>

      <Tabs defaultValue="overview">
        <TabsList className="rounded-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="fees">Fees</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="edit">Edit</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <GlassmorphicCard>
              <h2 className="mb-3 text-lg">Personal</h2>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <dt className="text-muted-foreground">Email</dt>
                <dd className="truncate font-medium">{student.user.email}</dd>
                <dt className="text-muted-foreground">Phone</dt>
                <dd className="font-medium">{student.user.phone ?? "—"}</dd>
                <dt className="text-muted-foreground">Gender</dt>
                <dd className="font-medium capitalize">
                  {student.user.gender ?? "—"}
                </dd>
                <dt className="text-muted-foreground">Date of birth</dt>
                <dd className="font-medium">
                  {student.user.dateOfBirth
                    ? format(student.user.dateOfBirth, "d MMM yyyy")
                    : "—"}
                </dd>
                <dt className="text-muted-foreground">Admission date</dt>
                <dd className="font-medium">
                  {student.admissionDate
                    ? format(student.admissionDate, "d MMM yyyy")
                    : "—"}
                </dd>
                <dt className="text-muted-foreground">Emergency contact</dt>
                <dd className="font-medium">
                  {student.emergencyContactName ?? "—"}
                  {student.emergencyContactPhone &&
                    ` (${student.emergencyContactPhone})`}
                </dd>
              </dl>
              {student.medicalNotes && (
                <p className="mt-3 rounded-2xl bg-warning/10 p-3 text-sm">
                  <strong>Medical:</strong> {student.medicalNotes}
                </p>
              )}
            </GlassmorphicCard>
            <GlassmorphicCard>
              <h2 className="mb-3 text-lg">Guardians</h2>
              {student.parentLinks.length === 0 ? (
                <EmptyState title="No guardians linked" />
              ) : (
                <ul className="space-y-2">
                  {student.parentLinks.map((link) => (
                    <li
                      key={link.id}
                      className="flex items-center gap-3 rounded-2xl bg-secondary/60 px-4 py-3"
                    >
                      <UserAvatar
                        firstName={link.parent.user.firstName}
                        lastName={link.parent.user.lastName}
                        className="size-9"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                          {link.parent.user.firstName}{" "}
                          {link.parent.user.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {link.relationship}
                          {link.isPrimaryContact && " • primary contact"}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {link.parent.user.phone}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </GlassmorphicCard>
          </div>
        </TabsContent>

        <TabsContent value="fees" className="mt-4">
          <GlassmorphicCard>
            <h2 className="mb-3 text-lg">Recent Fee Records</h2>
            {student.feePayments.length === 0 ? (
              <EmptyState title="No fee records" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-muted-foreground">
                      <th className="py-2 pr-4">Fee</th>
                      <th className="py-2 pr-4">Due date</th>
                      <th className="py-2 pr-4">Amount</th>
                      <th className="py-2 pr-4">Paid</th>
                      <th className="py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {student.feePayments.map((p) => (
                      <tr key={p.id} className="border-b border-border/50">
                        <td className="py-2 pr-4">{p.feeStructure.name}</td>
                        <td className="py-2 pr-4">
                          {format(p.dueDate, "d MMM yyyy")}
                        </td>
                        <td className="py-2 pr-4 tabular-nums">
                          ₹{Number(p.amountDue).toLocaleString("en-IN")}
                        </td>
                        <td className="py-2 pr-4 tabular-nums">
                          ₹{Number(p.amountPaid).toLocaleString("en-IN")}
                        </td>
                        <td className="py-2">
                          <Badge
                            className={
                              p.status === "paid"
                                ? "rounded-full bg-success/15 text-success"
                                : p.status === "partial"
                                  ? "rounded-full bg-warning/15 text-warning"
                                  : "rounded-full bg-destructive/15 text-destructive"
                            }
                          >
                            {p.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </GlassmorphicCard>
        </TabsContent>

        <TabsContent value="results" className="mt-4">
          <GlassmorphicCard>
            <h2 className="mb-3 text-lg">Recent Results</h2>
            {!snapshot || snapshot.recentResults.length === 0 ? (
              <EmptyState title="No results yet" />
            ) : (
              <ul className="space-y-2">
                {snapshot.recentResults.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center justify-between rounded-2xl bg-secondary/60 px-4 py-2.5 text-sm"
                  >
                    <div>
                      <p className="font-semibold">{r.subject}</p>
                      <p className="text-xs text-muted-foreground">{r.exam}</p>
                    </div>
                    <p className="font-bold tabular-nums">
                      {r.marksObtained ?? "AB"}/{r.totalMarks}
                      {r.grade && (
                        <span className="ml-2 rounded-full bg-primary/12 px-2 py-0.5 text-xs font-bold text-primary">
                          {r.grade}
                        </span>
                      )}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </GlassmorphicCard>
        </TabsContent>

        <TabsContent value="edit" className="mt-4">
          <StudentForm
            sections={sections.map((s) => ({ id: s.id, label: s.label }))}
            studentId={student.id}
            defaults={{
              firstName: student.user.firstName,
              lastName: student.user.lastName,
              email: student.user.email,
              phone: student.user.phone ?? undefined,
              gender: student.user.gender ?? undefined,
              dateOfBirth: student.user.dateOfBirth
                ? format(student.user.dateOfBirth, "yyyy-MM-dd")
                : undefined,
              sectionId: student.sectionId ?? undefined,
              rollNumber: student.rollNumber ?? undefined,
              bloodGroup: student.bloodGroup ?? undefined,
              address: student.user.address ?? undefined,
              emergencyContactName: student.emergencyContactName ?? undefined,
              emergencyContactPhone:
                student.emergencyContactPhone ?? undefined,
              medicalNotes: student.medicalNotes ?? undefined,
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
