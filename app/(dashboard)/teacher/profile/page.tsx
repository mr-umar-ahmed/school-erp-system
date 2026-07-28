import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/dal";
import { ProfileCard } from "@/components/shared/profile-card";

export const metadata: Metadata = { title: "My Profile" };

export default async function TeacherProfilePage() {
  const user = await requireRole(["teacher"]);
  return <ProfileCard user={user} />;
}
