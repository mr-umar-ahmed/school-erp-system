"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Eye, EyeOff, LogIn } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "@/features/auth/actions";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";

const DEMO_ACCOUNTS = [
  { label: "Admin", email: "admin@edunexus.app", password: "Admin@123" },
  { label: "Teacher", email: "sarah.johnson@edu.app", password: "Teacher@123" },
  { label: "Student", email: "alex.kumar@edu.app", password: "Student@123" },
  { label: "Parent", email: "rajesh.kumar@edu.app", password: "Parent@123" },
];

export function LoginForm() {
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const {
    register: field,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = (data: LoginInput) => {
    startTransition(async () => {
      const result = await login(data);
      // On success the action redirects; we only ever see errors here.
      if (result?.error) toast.error(result.error);
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <Card className="glass-strong rounded-3xl">
        <CardHeader>
          <CardTitle className="text-xl">Welcome back! 👋</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@school.edu"
                autoComplete="email"
                {...field("email")}
              />
              {errors.email && (
                <p className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  {...field("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-3 flex items-center text-muted-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full rounded-full"
              disabled={isPending}
            >
              <LogIn className="size-4" />
              {isPending ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="space-y-2 rounded-2xl bg-secondary p-3">
            <p className="text-xs font-medium text-secondary-foreground">
              Try a demo account
            </p>
            <div className="flex flex-wrap gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.label}
                  type="button"
                  onClick={() => {
                    setValue("email", acc.email);
                    setValue("password", acc.password);
                  }}
                  className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium transition-colors hover:bg-accent"
                >
                  {acc.label}
                </button>
              ))}
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            New school?{" "}
            <Link href="/register" className="text-primary hover:underline">
              Create an account
            </Link>
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
