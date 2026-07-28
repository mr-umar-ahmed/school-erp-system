"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole, institutionScope } from "@/lib/auth/dal";

const visitorSchema = z.object({
  visitorName: z.string().min(2, "Name is required"),
  phone: z.string().optional(),
  purpose: z.string().min(2, "Purpose is required"),
  whomToMeet: z.string().optional(),
  idProofType: z.string().optional(),
});
export type VisitorInput = z.infer<typeof visitorSchema>;

export async function checkInVisitor(
  input: VisitorInput
): Promise<{ error?: string; success?: string }> {
  const user = await requireRole(["super_admin", "admin", "staff"]);
  const institutionId = institutionScope(user);
  const parsed = visitorSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  await prisma.visitorLog.create({
    data: { institutionId, ...parsed.data },
  });
  revalidatePath("/admin/visitors");
  return { success: "Visitor checked in" };
}

export async function checkOutVisitor(
  id: string
): Promise<{ error?: string; success?: string }> {
  const user = await requireRole(["super_admin", "admin", "staff"]);
  const institutionId = institutionScope(user);
  const log = await prisma.visitorLog.findFirst({
    where: { id, institutionId, checkOut: null },
  });
  if (!log) return { error: "Active visit not found" };
  await prisma.visitorLog.update({
    where: { id },
    data: { checkOut: new Date() },
  });
  revalidatePath("/admin/visitors");
  return { success: "Visitor checked out" };
}
