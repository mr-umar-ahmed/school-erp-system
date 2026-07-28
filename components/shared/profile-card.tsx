import { format } from "date-fns";
import { GlassmorphicCard } from "@/components/shared/glassmorphic-card";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import { ROLE_LABELS } from "@/lib/constants";
import type { CurrentUser } from "@/lib/auth/dal";

/** Read-only profile page body shared by all roles. */
export function ProfileCard({ user }: { user: CurrentUser }) {
  const details: [string, string][] = [
    ["Email", user.email],
    ["Phone", user.phone ?? "—"],
    ["Gender", user.gender ?? "—"],
    [
      "Date of birth",
      user.dateOfBirth ? format(user.dateOfBirth, "d MMM yyyy") : "—",
    ],
    ["Address", user.address ?? "—"],
    ["School", user.institution?.name ?? "—"],
  ];

  if (user.student) {
    details.push(
      ["Admission No", user.student.admissionNo],
      ["Roll Number", String(user.student.rollNumber ?? "—")],
      ["Blood Group", user.student.bloodGroup ?? "—"]
    );
  }
  if (user.teacher) {
    details.push(
      ["Employee ID", user.teacher.employeeId],
      ["Department", user.teacher.department ?? "—"],
      ["Designation", user.teacher.designation ?? "—"],
      ["Qualification", user.teacher.qualification ?? "—"],
      ["Experience", `${user.teacher.experienceYears ?? "—"} years`]
    );
  }
  if (user.parent) {
    details.push(["Occupation", user.parent.occupation ?? "—"]);
  }

  return (
    <div className="space-y-6">
      <GlassmorphicCard className="flex flex-wrap items-center gap-5">
        <UserAvatar
          firstName={user.firstName}
          lastName={user.lastName}
          avatarUrl={user.avatarUrl}
          className="size-20 text-xl"
        />
        <div>
          <h1 className="text-2xl font-extrabold">
            {user.firstName} {user.lastName}
          </h1>
          <Badge className="mt-1 rounded-full bg-primary/12 text-primary">
            {ROLE_LABELS[user.role]}
          </Badge>
        </div>
      </GlassmorphicCard>

      <GlassmorphicCard>
        <h2 className="mb-4 text-lg">Details</h2>
        <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
          {details.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4 border-b border-border/50 pb-2">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="text-right font-medium">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-xs text-muted-foreground">
          Need something changed? Contact the school office to update your
          profile details.
        </p>
      </GlassmorphicCard>
    </div>
  );
}
