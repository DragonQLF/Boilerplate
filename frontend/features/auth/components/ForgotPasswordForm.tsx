"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { authClient } from "../lib/auth-client";
import { CheckEmail } from "./CheckEmail";
import { FormSkeleton } from "./FormSkeleton";
import { getAppUrl } from "@/lib/getAppUrl";

const forgotSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type ForgotValues = z.infer<typeof forgotSchema>;

export function ForgotPasswordForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  // Redirect already-authenticated users away from the forgot password page.
  // This is a UX guard only — real security is enforced server-side.
  const { data: session, isPending } = authClient.useSession();
  useEffect(() => {
    if (session?.user?.emailVerified) router.push("/dashboard");
  }, [session, router]);

  const form = useForm<ForgotValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: "" },
  });

  // Don't render the form until we know the session state — prevents
  // flashing the form before the redirect fires for logged-in users.
  if (isPending) return <FormSkeleton fields={1} />;

  async function onSubmit(values: ForgotValues) {
    setIsLoading(true);
    try {
      await authClient.requestPasswordReset({
        email: values.email,
        redirectTo: `${getAppUrl()}/reset-password`,
      });
      // Always show the same screen regardless of whether the email exists
      // — prevents email enumeration.
    } catch {
      // Intentionally silent — same screen shown either way.
    } finally {
      setIsLoading(false);
      setSubmittedEmail(values.email);
    }
  }

  if (submittedEmail) {
    return (
      <CheckEmail
        email={submittedEmail}
        eyebrow="Check your inbox"
        title="Reset link sent"
        body="If {email} is registered, you'll receive a password reset link shortly. The link expires in 1 hour."
        hint={
          <>
            Can&apos;t find it? Check your spam folder.
            <br />
            <Link href="/login" className="check-email-link">
              Back to sign in
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
        <Button type="submit" className="mt-2 w-full" disabled={isLoading}>
          {isLoading ? "Sending..." : "Send reset link"}
        </Button>
        <p className="mt-2 border-t border-gray-200 pt-6 text-center text-sm text-muted-foreground">
          Remember your password?{" "}
          <Link
            href="/login"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </form>
    </Form>
  );
}
