"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Lock, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";

const formSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof formSchema>;

interface ResetPasswordFormProps extends React.HTMLAttributes<HTMLDivElement> {}

export function ResetPasswordForm({
  className,
  ...props
}: ResetPasswordFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [isInvalidToken, setIsInvalidToken] = React.useState(false);

  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // Check if token and email are present
  React.useEffect(() => {
    if (!token || !email) {
      setIsInvalidToken(true);
    }
  }, [token, email]);

  async function onSubmit(values: FormData) {
    if (!token || !email) {
      toast.error("Invalid reset link", {
        description: "Please request a new password reset link.",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          token,
          password: values.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 400 && data.error?.includes("expired")) {
          setIsInvalidToken(true);
        }
        toast.error("Reset failed", {
          description: data.error || "Something went wrong. Please try again.",
        });
        return;
      }

      setIsSuccess(true);
      toast.success("Password reset successful", {
        description: "You can now sign in with your new password.",
      });

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (error) {
      console.error("Reset password error:", error);
      toast.error("Reset failed", {
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  // Invalid or expired token state
  if (isInvalidToken) {
    return (
      <Card className={cn("w-[400px]", className)} {...props}>
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-xl">Invalid or expired link</CardTitle>
          <CardDescription className="text-sm">
            This password reset link is invalid or has expired. Please request a
            new one.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button asChild className="w-full">
            <Link href="/forgot-password">Request new reset link</Link>
          </Button>
        </CardContent>
        <CardFooter className="flex justify-center border-t pt-4">
          <Link
            href="/login"
            className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </Link>
        </CardFooter>
      </Card>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <Card className={cn("w-[400px]", className)} {...props}>
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-xl">Password reset successful!</CardTitle>
          <CardDescription className="text-sm">
            Your password has been changed. You&apos;ll be redirected to the sign
            in page shortly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href="/login">Sign in now</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Reset password form
  return (
    <Card className={cn("w-[400px]", className)} {...props}>
      <CardHeader className="text-center pb-4">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Lock className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-xl">Create new password</CardTitle>
        <CardDescription className="text-sm">
          Enter a new password for your account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter new password"
              autoComplete="new-password"
              disabled={isLoading}
              {...form.register("password")}
            />
            {form.formState.errors.password && (
              <p className="text-sm text-destructive">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm new password"
              autoComplete="new-password"
              disabled={isLoading}
              {...form.register("confirmPassword")}
            />
            {form.formState.errors.confirmPassword && (
              <p className="text-sm text-destructive">
                {form.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>
          <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
            <p className="font-medium mb-1">Password requirements:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>At least 8 characters</li>
              <li>At least one uppercase letter</li>
              <li>At least one lowercase letter</li>
              <li>At least one number</li>
            </ul>
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Resetting password...
              </>
            ) : (
              "Reset password"
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center border-t pt-4">
        <Link
          href="/login"
          className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>
      </CardFooter>
    </Card>
  );
}
