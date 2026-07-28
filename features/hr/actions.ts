"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole, requireUser } from "@/lib/auth/dal";

const leaveSchema = z
  .object({
    leaveType: z.enum(["sick", "casual", "earned", "maternity", "other"]),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    reason: z.string().min(3, "Add a short reason"),
  })
  .refine((d) => d.startDate <= d.endDate, {
    message: "End date must be on or after start date",
    path: ["endDate"],
  });
export type LeaveInput = z.infer<typeof leaveSchema>;

export async function requestLeave(
  input: LeaveInput
): Promise<{ error?: string; success?: string }> {
  const user = await requireUser();
  if (!["teacher", "staff", "admin"].includes(user.role)) {
    return { error: "Only staff members can request leave" };
  }
  const parsed = leaveSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  await prisma.leaveRequest.create({
    data: {
      userId: user.id,
      leaveType: parsed.data.leaveType,
      startDate: new Date(parsed.data.startDate),
      endDate: new Date(parsed.data.endDate),
      reason: parsed.data.reason,
    },
  });
  revalidatePath("/teacher/leave");
  revalidatePath("/admin/hr-payroll");
  return { success: "Leave request submitted" };
}

export async function decideLeave(
  leaveId: string,
  decision: "approved" | "rejected"
): Promise<{ error?: string; success?: string }> {
  const user = await requireRole(["super_admin", "admin"]);
  const leave = await prisma.leaveRequest.findFirst({
    where: {
      id: leaveId,
      status: "pending",
      user: { institutionId: user.institutionId },
    },
  });
  if (!leave) return { error: "Pending request not found" };

  await prisma.$transaction([
    prisma.leaveRequest.update({
      where: { id: leaveId },
      data: {
        status: decision,
        approvedById: user.id,
        approvedAt: new Date(),
      },
    }),
    prisma.notification.create({
      data: {
        userId: leave.userId,
        title: `Leave ${decision}`,
        message: `Your ${leave.leaveType} leave request was ${decision}.`,
        type: "general",
      },
    }),
  ]);
  revalidatePath("/admin/hr-payroll");
  return { success: `Request ${decision}` };
}
