"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole, institutionScope } from "@/lib/auth/dal";

const collectSchema = z.object({
  feePaymentId: z.string().uuid(),
  amount: z.coerce.number().positive("Amount must be positive"),
  method: z.enum(["cash", "online", "upi", "cheque"]),
  remarks: z.string().optional(),
});
export type CollectInput = z.infer<typeof collectSchema>;

async function nextReceiptNumber(): Promise<string> {
  const last = await prisma.feePayment.findFirst({
    where: { receiptNumber: { not: null } },
    orderBy: { receiptNumber: "desc" },
    select: { receiptNumber: true },
  });
  const lastNum = last?.receiptNumber
    ? Number(last.receiptNumber.split("-").pop())
    : 0;
  return `RCPT-${String(lastNum + 1).padStart(6, "0")}`;
}

async function applyPayment(
  feePaymentId: string,
  amount: number,
  method: string,
  remarks?: string
) {
  const payment = await prisma.feePayment.findUnique({
    where: { id: feePaymentId },
  });
  if (!payment) return { error: "Fee record not found" as const };

  const due = Number(payment.amountDue);
  const alreadyPaid = Number(payment.amountPaid);
  const outstanding = due - alreadyPaid;
  if (outstanding <= 0) return { error: "This fee is already settled" as const };
  if (amount > outstanding) {
    return {
      error: `Amount exceeds outstanding balance (₹${outstanding})` as const,
    };
  }

  const newPaid = alreadyPaid + amount;
  const receiptNumber = payment.receiptNumber ?? (await nextReceiptNumber());
  await prisma.feePayment.update({
    where: { id: feePaymentId },
    data: {
      amountPaid: newPaid,
      status: newPaid >= due ? "paid" : "partial",
      paidDate: new Date(),
      paymentMethod: method,
      receiptNumber,
      remarks: remarks || payment.remarks,
    },
  });
  return { receiptNumber };
}

/** Admin/staff records a counter payment. */
export async function collectFee(
  input: CollectInput
): Promise<{ error?: string; success?: string }> {
  const user = await requireRole(["super_admin", "admin", "staff"]);
  const institutionId = institutionScope(user);
  const parsed = collectSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const payment = await prisma.feePayment.findFirst({
    where: {
      id: parsed.data.feePaymentId,
      student: { user: { institutionId } },
    },
  });
  if (!payment) return { error: "Fee record not found" };

  const result = await applyPayment(
    parsed.data.feePaymentId,
    parsed.data.amount,
    parsed.data.method,
    parsed.data.remarks
  );
  if ("error" in result) return { error: result.error };

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "fee.collect",
      tableName: "fee_payments",
      recordId: parsed.data.feePaymentId,
      newValues: { amount: parsed.data.amount, method: parsed.data.method },
    },
  });

  revalidatePath("/admin/fees");
  return { success: `Payment recorded — receipt ${result.receiptNumber}` };
}

/** Parent settles their own child's due (demo online payment). */
export async function payFeeOnline(
  feePaymentId: string
): Promise<{ error?: string; success?: string }> {
  const user = await requireRole(["parent"]);
  if (!user.parent) return { error: "Parent profile missing" };

  const payment = await prisma.feePayment.findFirst({
    where: {
      id: feePaymentId,
      student: { parentLinks: { some: { parentId: user.parent.id } } },
    },
  });
  if (!payment) return { error: "Fee record not found" };

  const outstanding = Number(payment.amountDue) - Number(payment.amountPaid);
  const result = await applyPayment(feePaymentId, outstanding, "online");
  if ("error" in result) return { error: result.error };

  revalidatePath("/parent/fees");
  revalidatePath("/parent");
  return {
    success: `Payment successful — receipt ${result.receiptNumber}`,
  };
}

const structureSchema = z.object({
  name: z.string().min(2),
  classId: z.string().uuid().optional(),
  amount: z.coerce.number().positive(),
  frequency: z.enum(["monthly", "quarterly", "annually", "one-time"]),
  dueDay: z.coerce.number().int().min(1).max(28).optional(),
  lateFeePerDay: z.coerce.number().min(0).default(0),
});
export type StructureInput = z.infer<typeof structureSchema>;

export async function createFeeStructure(
  input: StructureInput
): Promise<{ error?: string; success?: string }> {
  const user = await requireRole(["super_admin", "admin"]);
  const institutionId = institutionScope(user);
  const parsed = structureSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const year = await prisma.academicYear.findFirst({
    where: { institutionId, isCurrent: true },
  });
  await prisma.feeStructure.create({
    data: {
      institutionId,
      name: parsed.data.name,
      classId: parsed.data.classId ?? null,
      amount: parsed.data.amount,
      frequency: parsed.data.frequency,
      academicYearId: year?.id,
      dueDay: parsed.data.dueDay ?? null,
      lateFeePerDay: parsed.data.lateFeePerDay,
    },
  });
  revalidatePath("/admin/fees");
  return { success: "Fee structure created" };
}
