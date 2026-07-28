"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole, institutionScope } from "@/lib/auth/dal";

const issueSchema = z.object({
  bookId: z.string().uuid(),
  borrowerEmail: z.email("Enter the borrower's email"),
  days: z.number().int().min(1).max(60).default(14),
});
export type IssueInput = z.input<typeof issueSchema>;

export async function issueBook(
  input: IssueInput
): Promise<{ error?: string; success?: string }> {
  const user = await requireRole(["super_admin", "admin", "staff"]);
  const institutionId = institutionScope(user);
  const parsed = issueSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const [book, borrower] = await Promise.all([
    prisma.libraryBook.findFirst({
      where: { id: parsed.data.bookId, institutionId },
    }),
    prisma.user.findFirst({
      where: {
        email: parsed.data.borrowerEmail.toLowerCase(),
        institutionId,
        isActive: true,
      },
    }),
  ]);
  if (!book) return { error: "Book not found" };
  if (!borrower) return { error: "No user with that email in this school" };
  if (book.availableCopies < 1) return { error: "No copies available" };

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + parsed.data.days);

  await prisma.$transaction([
    prisma.libraryTransaction.create({
      data: {
        bookId: book.id,
        userId: borrower.id,
        dueDate,
      },
    }),
    prisma.libraryBook.update({
      where: { id: book.id },
      data: { availableCopies: { decrement: 1 } },
    }),
  ]);
  revalidatePath("/admin/library");
  return {
    success: `"${book.title}" issued to ${borrower.firstName} ${borrower.lastName}`,
  };
}

export async function returnBook(
  transactionId: string
): Promise<{ error?: string; success?: string }> {
  const user = await requireRole(["super_admin", "admin", "staff"]);
  const institutionId = institutionScope(user);

  const txn = await prisma.libraryTransaction.findFirst({
    where: {
      id: transactionId,
      book: { institutionId },
      returnDate: null,
    },
    include: { book: true },
  });
  if (!txn) return { error: "Active transaction not found" };

  const today = new Date();
  const overdueDays = Math.max(
    0,
    Math.floor((today.getTime() - txn.dueDate.getTime()) / 86400000)
  );
  const fine = overdueDays * 5; // ₹5/day late fine

  await prisma.$transaction([
    prisma.libraryTransaction.update({
      where: { id: txn.id },
      data: {
        returnDate: today,
        status: "returned",
        fineAmount: fine,
      },
    }),
    prisma.libraryBook.update({
      where: { id: txn.bookId },
      data: { availableCopies: { increment: 1 } },
    }),
  ]);
  revalidatePath("/admin/library");
  return {
    success: fine
      ? `Book returned — ₹${fine} late fine recorded`
      : "Book returned",
  };
}
