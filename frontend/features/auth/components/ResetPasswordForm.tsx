"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { authClient } from "../lib/auth-client";
import { FormSkeleton } from "./FormSkeleton";

const resetSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(72, "Password must be at most 72 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[0-9]/, "Must contain at least one number")
      .regex(/[^A-Za-z0-9]/, "Must contain at least one special character"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetValues = z.infer<typeof resetSchema>;

// ── Success state ─────────────────────────────────────────────────────────────
function PasswordChanged() {
  return (
    <>
      <style>{`
        @keyframes reset-success-in {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .reset-success { animation: reset-success-in 0.35s ease both; }
        .reset-success-icon {
          width: 44px; height: 44px;
          border: 1px solid #C8813A;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 1.75rem;
          color: #C8813A; font-size: 1.1rem;
        }
        .reset-success-eyebrow {
          font-size: 0.6rem; letter-spacing: 0.22em;
          text-transform: uppercase; color: #C8813A;
          margin-bottom: 0.6rem;
          font-family: 'JetBrains Mono', monospace;
        }
        .reset-success-title {
          font-family: 'Libre Baskerville', serif;
          font-size: 1.65rem; font-weight: 700; color: #0C0C0C;
          letter-spacing: -0.025em; line-height: 1.2; margin-bottom: 1rem;
        }
        .reset-success-body {
          font-size: 0.72rem; color: #4A4A4A; line-height: 1.85;
          font-weight: 300; font-family: 'JetBrains Mono', monospace;
          margin-bottom: 2rem;
        }
        .reset-success-divider { border: none; border-top: 1px solid #E0DBD3; margin-bottom: 1.5rem; }
        .reset-success-hint {
          font-size: 0.62rem; color: #4A4A4A; line-height: 1.7;
          font-family: 'JetBrains Mono', monospace; font-weight: 300;
        }
        .reset-success-link {
          color: #0C0C0C; font-weight: 500;
          text-decoration: underline; text-underline-offset: 3px;
        }
      `}</style>
      <div className="reset-success">
        <div className="reset-success-icon">✓</div>
        <div className="reset-success-eyebrow">All done</div>
        <h2 className="reset-success-title">Password changed</h2>
        <p className="reset-success-body">
          Your password has been updated. You can now sign in with your new
          password.
        </p>
        <hr className="reset-success-divider" />
        <p className="reset-success-hint">
          <Link href="/login" className="reset-success-link">
            Go to sign in
          </Link>
        </p>
      </div>
    </>
  );
}

// ── Invalid / expired token state ─────────────────────────────────────────────
function InvalidToken() {
  return (
    <>
      <style>{`
        .reset-invalid { animation: reset-success-in 0.35s ease both; }
        .reset-invalid-icon {
          width: 44px; height: 44px;
          border: 1px solid #E24B4A;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 1.75rem;
          color: #E24B4A; font-size: 1.1rem;
        }
        .reset-invalid-eyebrow {
          font-size: 0.6rem; letter-spacing: 0.22em;
          text-transform: uppercase; color: #E24B4A;
          margin-bottom: 0.6rem;
          font-family: 'JetBrains Mono', monospace;
        }
        .reset-invalid-title {
          font-family: 'Libre Baskerville', serif;
          font-size: 1.65rem; font-weight: 700; color: #0C0C0C;
          letter-spacing: -0.025em; line-height: 1.2; margin-bottom: 1rem;
        }
        .reset-invalid-body {
          font-size: 0.72rem; color: #4A4A4A; line-height: 1.85;
          font-weight: 300; font-family: 'JetBrains Mono', monospace;
          margin-bottom: 2rem;
        }
        .reset-invalid-divider { border: none; border-top: 1px solid #E0DBD3; margin-bottom: 1.5rem; }
        .reset-invalid-hint {
          font-size: 0.62rem; color: #4A4A4A; line-height: 1.7;
          font-family: 'JetBrains Mono', monospace; font-weight: 300;
        }
        .reset-invalid-link {
          color: #0C0C0C; font-weight: 500;
          text-decoration: underline; text-underline-offset: 3px;
        }
      `}</style>
      <div className="reset-invalid">
        <div className="reset-invalid-icon">✕</div>
        <div className="reset-invalid-eyebrow">Link expired</div>
        <h2 className="reset-invalid-title">Invalid reset link</h2>
        <p className="reset-invalid-body">
          This password reset link is invalid or has expired. Reset links are
          valid for 1 hour.
        </p>
        <hr className="reset-invalid-divider" />
        <p className="reset-invalid-hint">
          <Link href="/forgot-password" className="reset-invalid-link">
            Request a new link
          </Link>
        </p>
      </div>
    </>
  );
}

// ── Reset form ────────────────────────────────────────────────────────────────
export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [invalidToken, setInvalidToken] = useState(!token);

  // Redirect already-authenticated users away from the reset password page.
  // This is a UX guard only — real security is enforced server-side.
  const { data: session, isPending } = authClient.useSession();
  useEffect(() => {
    if (session?.user?.emailVerified) router.push("/dashboard");
  }, [session, router]);

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => router.push("/login"), 3000);
    return () => clearTimeout(timer);
  }, [success, router]);

  const form = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  async function onSubmit(values: ResetValues) {
    if (!token) {
      setInvalidToken(true);
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await authClient.resetPassword({
        newPassword: values.password,
        token,
      });

      if (error) {
        if (
          error.code === "INVALID_TOKEN" ||
          error.code === "TOKEN_EXPIRED"
        ) {
          setInvalidToken(true);
          return;
        }
        toast({
          variant: "destructive",
          title: "Reset failed",
          description: "Something went wrong. Please try again.",
        });
        return;
      }

      setSuccess(true);
    } catch {
      toast({
        variant: "destructive",
        title: "Reset failed",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (isPending) return <FormSkeleton fields={2} />;
  if (invalidToken) return <InvalidToken />;
  if (success) return <PasswordChanged />;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full mt-2" disabled={isLoading}>
          {isLoading ? "Updating..." : "Update password"}
        </Button>
        <p className="text-center text-sm text-muted-foreground pt-6 mt-2 border-t border-gray-200">
          Remember your password?{" "}
          <Link
            href="/login"
            className="text-primary underline-offset-4 hover:underline font-medium"
          >
            Sign in
          </Link>
        </p>
      </form>
    </Form>
  );
}
