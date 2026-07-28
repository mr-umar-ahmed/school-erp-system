"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession } from "@/lib/auth/session";
import { sendEmail } from "@/lib/email";
import { ROLE_HOME } from "@/lib/constants";
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  type LoginInput,
  type RegisterInput,
  type ForgotPasswordInput,
  type ResetPasswordInput,
} from "@/lib/validations/auth";

export interface ActionResult {
  error?: string;
  success?: string;
}

export async function login(input: LoginInput): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });
  if (!user || !user.isActive) {
    return { error: "Invalid email or password" };
  }
  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) {
    return { error: "Invalid email or password" };
  }

  await createSession({
    sub: user.id,
    role: user.role,
    institutionId: user.institutionId,
    name: `${user.firstName} ${user.lastName}`,
  });

  redirect(user.onboardingCompleted ? ROLE_HOME[user.role] : "/welcome");
}

export async function register(input: RegisterInput): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { institutionName, firstName, lastName, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
  if (existing) {
    return { error: "An account with this email already exists" };
  }

  const passwordHash = await hashPassword(password);
  const code = `SCH-${randomBytes(3).toString("hex").toUpperCase()}`;

  const user = await prisma.$transaction(async (tx) => {
    const institution = await tx.institution.create({
      data: { name: institutionName, code },
    });
    return tx.user.create({
      data: {
        institutionId: institution.id,
        role: "admin",
        firstName,
        lastName,
        email: email.toLowerCase(),
        passwordHash,
      },
    });
  });

  await createSession({
    sub: user.id,
    role: user.role,
    institutionId: user.institutionId,
    name: `${user.firstName} ${user.lastName}`,
  });

  redirect("/welcome");
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/login");
}

export async function requestPasswordReset(
  input: ForgotPasswordInput
): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });
  // Always report success so the form can't be used to probe for accounts.
  if (user) {
    const token = randomBytes(32).toString("hex");
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 1000 * 60 * 30), // 30 minutes
      },
    });
    const url = `${process.env.NEXT_PUBLIC_APP_URL}/forgot-password?token=${token}`;
    await sendEmail({
      to: user.email,
      subject: "Reset your EduNexus password",
      text: `Hi ${user.firstName},\n\nReset your password here (valid 30 minutes):\n${url}`,
    });
  }
  return {
    success: "If that email exists, a reset link has been sent.",
  };
}

export async function resetPassword(
  input: ResetPasswordInput
): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const record = await prisma.passwordResetToken.findUnique({
    where: { token: parsed.data.token },
  });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return { error: "This reset link is invalid or has expired" };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return { success: "Password updated. You can now sign in." };
}

export async function completeOnboarding(): Promise<void> {
  const { getSession } = await import("@/lib/auth/session");
  const session = await getSession();
  if (!session) redirect("/login");
  await prisma.user.update({
    where: { id: session.sub },
    data: { onboardingCompleted: true },
  });
  redirect(ROLE_HOME[session.role]);
}
