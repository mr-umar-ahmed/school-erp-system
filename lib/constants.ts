import { UserRole } from "@/lib/generated/prisma/enums";

export const SESSION_COOKIE = "edunexus_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

/** Where each role lands after login. */
export const ROLE_HOME: Record<UserRole, string> = {
  super_admin: "/admin",
  admin: "/admin",
  staff: "/admin",
  teacher: "/teacher",
  student: "/student",
  parent: "/parent",
};

/** Which roles may enter each dashboard area (first path segment). */
export const AREA_ROLES: Record<string, UserRole[]> = {
  admin: ["super_admin", "admin", "staff"],
  teacher: ["teacher"],
  student: ["student"],
  parent: ["parent"],
};

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  staff: "Staff",
  teacher: "Teacher",
  student: "Student",
  parent: "Parent",
};

export const APP_NAME = "EduNexus";
