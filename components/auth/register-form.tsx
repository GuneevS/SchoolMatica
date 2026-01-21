"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Building2, User, Mail, Lock, CheckCircle2 } from "lucide-react";

const formSchema = z.object({
  schoolName: z.string().min(2, "School name must be at least 2 characters"),
  schoolShortCode: z.string().min(2, "Short code must be at least 2 characters").max(10, "Short code must be at most 10 characters").optional().or(z.literal("")),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof formSchema>;

export function RegisterForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [step, setStep] = React.useState<1 | 2 | 3>(1);
  const [isComplete, setIsComplete] = React.useState(false);
  const [registeredData, setRegisteredData] = React.useState<{
    schoolName: string;
    email: string;
  } | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      schoolName: "",
      schoolShortCode: "",
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onChange",
  });

  const { watch, trigger, formState: { errors } } = form;
  const watchedFields = watch();

  async function validateStep(currentStep: 1 | 2): Promise<boolean> {
    if (currentStep === 1) {
      return await trigger(["schoolName", "schoolShortCode"]);
    }
    if (currentStep === 2) {
      return await trigger(["firstName", "lastName", "email"]);
    }
    return true;
  }

  async function nextStep() {
    const isValid = await validateStep(step as 1 | 2);
    if (isValid && step < 3) {
      setStep((s) => (s + 1) as 1 | 2 | 3);
    }
  }

  function prevStep() {
    if (step > 1) {
      setStep((s) => (s - 1) as 1 | 2 | 3);
    }
  }

  async function onSubmit(values: FormData) {
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        if (Array.isArray(data.error)) {
          data.error.forEach((err: { field: string; message: string }) => {
            form.setError(err.field as keyof FormData, { message: err.message });
          });
          toast.error("Please fix the errors and try again");
        } else {
          toast.error("Registration failed", { description: data.error });
        }
        setIsLoading(false);
        return;
      }

      // Success!
      setRegisteredData({
        schoolName: data.school.name,
        email: data.user.email,
      });
      setIsComplete(true);
      toast.success("Registration successful!", {
        description: "Your school has been created. You can now sign in.",
      });
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("Registration failed", {
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (isComplete && registeredData) {
    return (
      <Card className="w-[420px]">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl">Welcome to SchoolMatica!</CardTitle>
          <CardDescription className="text-base mt-2">
            Your school has been successfully registered
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium">School: {registeredData.schoolName}</p>
            <p className="text-sm text-muted-foreground">Admin: {registeredData.email}</p>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            You can now sign in with your email and password to access your school dashboard.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button 
            className="w-full" 
            onClick={() => router.push("/login")}
          >
            Sign In to Your Dashboard
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-[420px]">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl">Register Your School</CardTitle>
        <CardDescription>
          Create your school account in 3 simple steps
        </CardDescription>
        {/* Step indicator */}
        <div className="flex items-center justify-between mt-4 px-2">
          {[
            { num: 1, label: "School", icon: Building2 },
            { num: 2, label: "Admin", icon: User },
            { num: 3, label: "Security", icon: Lock },
          ].map((s, i) => (
            <React.Fragment key={s.num}>
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                    step >= s.num
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <s.icon className="w-5 h-5" />
                </div>
                <span className="text-xs mt-1 text-muted-foreground">{s.label}</span>
              </div>
              {i < 2 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-2 transition-colors",
                    step > s.num ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Step 1: School Details */}
          <div className={cn("space-y-4", step !== 1 && "hidden")}>
            <div className="space-y-2">
              <Label htmlFor="schoolName">School Name *</Label>
              <Input
                id="schoolName"
                placeholder="e.g., Springfield High School"
                {...form.register("schoolName")}
                disabled={isLoading}
              />
              {errors.schoolName && (
                <p className="text-sm text-destructive">{errors.schoolName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="schoolShortCode">Short Code (optional)</Label>
              <Input
                id="schoolShortCode"
                placeholder="e.g., SHS"
                maxLength={10}
                {...form.register("schoolShortCode")}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                A unique identifier for your school (2-10 characters)
              </p>
              {errors.schoolShortCode && (
                <p className="text-sm text-destructive">{errors.schoolShortCode.message}</p>
              )}
            </div>
          </div>

          {/* Step 2: Admin Details */}
          <div className={cn("space-y-4", step !== 2 && "hidden")}>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  {...form.register("firstName")}
                  disabled={isLoading}
                />
                {errors.firstName && (
                  <p className="text-sm text-destructive">{errors.firstName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  {...form.register("lastName")}
                  disabled={isLoading}
                />
                {errors.lastName && (
                  <p className="text-sm text-destructive">{errors.lastName.message}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@school.edu"
                {...form.register("email")}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                This will be your login email
              </p>
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
          </div>

          {/* Step 3: Password */}
          <div className={cn("space-y-4", step !== 3 && "hidden")}>
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimum 8 characters"
                {...form.register("password")}
                disabled={isLoading}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Re-enter your password"
                {...form.register("confirmPassword")}
                disabled={isLoading}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          {/* Navigation buttons */}
          <div className="flex gap-2 pt-4">
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={isLoading}
                className="flex-1"
              >
                Back
              </Button>
            )}
            {step < 3 ? (
              <Button
                type="button"
                onClick={nextStep}
                disabled={isLoading}
                className="flex-1"
              >
                Continue
              </Button>
            ) : (
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center border-t pt-4">
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
