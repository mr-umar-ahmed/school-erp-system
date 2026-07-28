"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { KeyRound, MailQuestion } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  requestPasswordReset,
  resetPassword,
} from "@/features/auth/actions";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  type ForgotPasswordInput,
  type ResetPasswordInput,
} from "@/lib/validations/auth";

function RequestResetForm() {
  const [isPending, startTransition] = useTransition();
  const {
    register: field,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = (data: ForgotPasswordInput) => {
    startTransition(async () => {
      const result = await requestPasswordReset(data);
      if (result.error) toast.error(result.error);
      if (result.success) toast.success(result.success);
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@school.edu"
          {...field("email")}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>
      <Button type="submit" className="w-full rounded-full" disabled={isPending}>
        <MailQuestion className="size-4" />
        {isPending ? "Sending..." : "Send Reset Link"}
      </Button>
    </form>
  );
}

function ResetWithTokenForm({ token }: { token: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const {
    register: field,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token },
  });

  const onSubmit = (data: ResetPasswordInput) => {
    startTransition(async () => {
      const result = await resetPassword(data);
      if (result.error) toast.error(result.error);
      if (result.success) {
        toast.success(result.success);
        router.push("/login");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <input type="hidden" {...field("token")} />
      <div className="space-y-2">
        <Label htmlFor="password">New password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          {...field("password")}
        />
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          {...field("confirmPassword")}
        />
        {errors.confirmPassword && (
          <p className="text-sm text-destructive">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>
      <Button type="submit" className="w-full rounded-full" disabled={isPending}>
        <KeyRound className="size-4" />
        {isPending ? "Updating..." : "Set New Password"}
      </Button>
    </form>
  );
}

export function ForgotPasswordForm({ token }: { token?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <Card className="glass-strong rounded-3xl">
        <CardHeader>
          <CardTitle className="text-xl">
            {token ? "Choose a new password" : "Reset your password"}
          </CardTitle>
          {!token && (
            <p className="text-sm text-muted-foreground">
              We&apos;ll send a reset link to your email address.
            </p>
          )}
        </CardHeader>
        <CardContent>
          {token ? <ResetWithTokenForm token={token} /> : <RequestResetForm />}
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Remembered it?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Back to sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
