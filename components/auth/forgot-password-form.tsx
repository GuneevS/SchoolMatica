"use client";

import * as React from "react";
import Link from "next/link";
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
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";

const formSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type FormData = z.infer<typeof formSchema>;

interface ForgotPasswordFormProps extends React.HTMLAttributes<HTMLDivElement> {}

export function ForgotPasswordForm({
  className,
  ...props
}: ForgotPasswordFormProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [submittedEmail, setSubmittedEmail] = React.useState("");

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(values: FormData) {
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error("Request failed", {
          description: data.error || "Something went wrong. Please try again.",
        });
        return;
      }

      // Always show success for security (prevents email enumeration)
      setSubmittedEmail(values.email);
      setIsSubmitted(true);
      toast.success("Email sent", {
        description: "Check your inbox for the password reset link.",
      });

      // In development, show the reset URL in console
      if (data.resetUrl) {
        console.log("🔑 Development Reset URL:", data.resetUrl);
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      toast.error("Request failed", {
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (isSubmitted) {
    return (
      <Card className={cn("w-[400px]", className)} {...props}>
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-xl">Check your email</CardTitle>
          <CardDescription className="text-sm">
            We&apos;ve sent a password reset link to{" "}
            <span className="font-medium text-foreground">{submittedEmail}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
            <p className="mb-2">
              <strong>Didn&apos;t receive the email?</strong>
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>Check your spam or junk folder</li>
              <li>Make sure you entered the correct email</li>
              <li>The link expires in 1 hour</li>
            </ul>
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              setIsSubmitted(false);
              form.reset();
            }}
          >
            Try a different email
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

  return (
    <Card className={cn("w-[400px]", className)} {...props}>
      <CardHeader className="text-center pb-4">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Mail className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-xl">Forgot your password?</CardTitle>
        <CardDescription className="text-sm">
          Enter your email address and we&apos;ll send you a link to reset your
          password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@yourschool.edu"
              autoComplete="email"
              disabled={isLoading}
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending reset link...
              </>
            ) : (
              "Send reset link"
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
