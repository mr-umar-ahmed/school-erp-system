// Data-access layer for the authenticated user. App-level authorization
// (role + institution scoping) lives here — the self-hosted replacement
// for Supabase RLS.
import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { ROLE_HOME } from "@/lib/constants";
import type { UserRole } from "@/lib/generated/prisma/enums";

export const getCurrentUser = cache(async () => {
  const session = await getSession();
  if (!session) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    include: {
      institution: true,
      student: true,
      teacher: true,
      parent: true,
      staff: true,
    },
  });
  if (!user || !user.isActive) return null;
  return user;
});

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

/** Redirects to /login when unauthenticated. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Redirects to the user's own dashboard when their role is not allowed. */
export async function requireRole(roles: UserRole[]): Promise<CurrentUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect(ROLE_HOME[user.role]);
  return user;
}

/**
 * The institution id every query must be scoped by. Super admins may pass
 * an explicit override; everyone else is pinned to their own institution.
 */
export function institutionScope(user: CurrentUser): string {
  if (!user.institutionId) {
    throw new Error("User has no institution");
  }
  return user.institutionId;
}
