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
import { CheckEmail } from "./CheckEmail";
import { FormSkeleton } from "./FormSkeleton";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginValues = z.infer<typeof loginSchema>;

// Validates that a callbackUrl is safe to redirect to — must be a relative
// path starting with / and not a protocol-relative URL (//evil.com).
function getSafeCallbackUrl(raw: string | null): string {
  if (!raw) return "/dashboard";
  if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return "/dashboard";
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);

  // Redirect already-authenticated users away from the login page.
  // This is a UX guard only — real security is enforced server-side.
  const { data: session, isPending } = authClient.useSession();
  useEffect(() => {
    if (session?.user?.emailVerified) {
      router.push(getSafeCallbackUrl(searchParams.get("callbackUrl")));
    }
  }, [session, router, searchParams]);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  // Don't render the form until we know the session state — prevents
  // flashing the form before the redirect fires for logged-in users.
  if (isPending) return <FormSkeleton fields={2} />;

  async function onSubmit(values: LoginValues) {
    setIsLoading(true);
    try {
      const { error } = await authClient.signIn.email({
        email: values.email,
        password: values.password,
      });

      if (error) {
        if (error.code === "EMAIL_NOT_VERIFIED") {
          setUnverifiedEmail(values.email);
          return;
        }
        toast({
          variant: "destructive",
          title: "Sign in failed",
          description: "Invalid email or password.",
        });
        return;
      }

      router.push(getSafeCallbackUrl(searchParams.get("callbackUrl")));
    } catch {
      toast({
        variant: "destructive",
        title: "Sign in failed",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (unverifiedEmail) {
    return (
      <CheckEmail
        email={unverifiedEmail}
        eyebrow="One step left"
        title="Verify your email"
        body="{email} hasn't been verified yet. Check your inbox for the verification link we sent when you signed up."
        hint={
          <>
            Can&apos;t find it? Check your spam folder.
            <br />
            <Link href="/register" className="check-email-link">
              Back to sign up
            </Link>
          </>
        }
      />
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="you@example.com" autoComplete="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" autoComplete="current-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="text-right">
          <Link
            href="/forgot-password"
            className="text-xs text-muted-foreground hover:text-primary underline-offset-4 hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <Button type="submit" className="w-full mt-2" disabled={isLoading}>
          {isLoading ? "Signing in..." : "Sign in"}
        </Button>
        <p className="text-center text-sm text-muted-foreground pt-6 mt-2 border-t border-gray-200">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-primary underline-offset-4 hover:underline font-medium">
            Create one
          </Link>
        </p>
      </form>
    </Form>
  );
}
