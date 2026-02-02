"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RoleLoginTabs, LoginRole, roleOptions } from "./role-login-tabs";
import { SchoolSelector } from "./school-selector";
import {
  Loader2,
  Eye,
  EyeOff,
  ArrowRight,
  Mail,
  Lock,
  Shield,
  AlertCircle,
} from "lucide-react";
import { UnifiedLogo } from "@/components/brand/unified-logo";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  schoolId: z.string().optional(),
  rememberMe: z.boolean(),
});

type FormData = z.infer<typeof formSchema>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedRole, setSelectedRole] = React.useState<LoginRole>("teacher");
  const [showPassword, setShowPassword] = React.useState(false);
  const showQuickAccess =
    process.env.NODE_ENV !== "production" ||
    process.env.NEXT_PUBLIC_SHOW_DEMO_LOGIN === "true";

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      schoolId: "",
      rememberMe: false,
    },
  });

  // Determine if school selector should be shown (hidden for School Admin and Platform Admin)
  const showSchoolSelector = selectedRole !== "school" && selectedRole !== "platform";

  const resolveRedirect = React.useCallback(
    (role: LoginRole) => {
      if (role === "platform") return "/super-admin";
      if (role === "parent") return "/parent";
      if (role === "student") return "/student";
      return callbackUrl;
    },
    [callbackUrl],
  );

  const performLogin = React.useCallback(
    async (email: string, password: string, roleOverride?: LoginRole) => {
      const role = roleOverride ?? selectedRole;
      setIsLoading(true);
      setError(null);

      try {
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
          callbackUrl: callbackUrl,
        });

        if (result?.error) {
          if (result.error.includes("locked")) {
            setError("Your account has been temporarily locked. Please try again later or reset your password.");
          } else {
            setError("Invalid email or password. Please check your credentials and try again.");
          }
          setIsLoading(false);
        } else {
          router.push(resolveRedirect(role));
          router.refresh();
        }
      } catch {
        setError("An unexpected error occurred. Please try again.");
        setIsLoading(false);
      }
    },
    [callbackUrl, resolveRedirect, router, selectedRole],
  );

  const quickLogins = React.useMemo(
    () => [
      {
        id: "platform",
        label: "Platform Admin",
        role: "platform" as LoginRole,
        email: "platform@schoolmatica.dev",
        password: "Password123!",
      },
      {
        id: "school-admin",
        label: "School Admin",
        role: "school" as LoginRole,
        email: "admin@nimbus.edu",
        password: "Password123!",
      },
      {
        id: "hod",
        label: "HOD",
        role: "hod" as LoginRole,
        email: "hod@nimbus.edu",
        password: "Password123!",
      },
      {
        id: "teacher",
        label: "Teacher",
        role: "teacher" as LoginRole,
        email: "teacher@nimbus.edu",
        password: "Password123!",
      },
      {
        id: "smt",
        label: "SMT",
        role: "smt" as LoginRole,
        email: "smt@nimbus.edu",
        password: "Password123!",
      },
      {
        id: "parent",
        label: "Parent",
        role: "parent" as LoginRole,
        email: "parent@nimbus.edu",
        password: "Password123!",
      },
      {
        id: "student",
        label: "Student",
        role: "student" as LoginRole,
        email: "student@nimbus.edu",
        password: "Password123!",
      },
    ],
    [],
  );

  async function onSubmit(values: FormData) {
    await performLogin(values.email, values.password, selectedRole);
  }

  const handleQuickLogin = async (preset: (typeof quickLogins)[number]) => {
    setSelectedRole(preset.role);
    form.setValue("email", preset.email);
    form.setValue("password", preset.password);
    await performLogin(preset.email, preset.password, preset.role);
  };
  

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Logo and Title */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <UnifiedLogo variant="icon" size="lg" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">
          Welcome to SchoolMatica
        </h1>
        <p className="text-muted-foreground mt-1">
          South Africa&apos;s complete school management platform
        </p>
      </div>

      {/* Role Selector */}
      <div className="mb-6">
        <RoleLoginTabs value={selectedRole} onChange={setSelectedRole} />
      </div>

      {/* Login Card - SOLID BACKGROUND */}
      <div className="relative">
        {/* Subtle glow effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-[hsl(var(--accent-violet))]/10 via-[hsl(var(--accent-iris))]/10 to-[hsl(var(--accent-flamingo))]/10 rounded-3xl blur-xl" />
        
        {/* Main card with SOLID background */}
        <div className="relative bg-[hsl(var(--surface-strong))] rounded-2xl border border-[hsl(var(--border-strong))] shadow-2xl p-6 sm:p-8">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* School Selector - for non-admin roles */}
            {showSchoolSelector && (
              <div className="space-y-2">
                <Label htmlFor="school" className="text-sm font-medium text-foreground">
                  School
                </Label>
                <SchoolSelector
                  value={form.watch("schoolId")}
                  onSelect={(schoolId) => form.setValue("schoolId", schoolId)}
                  disabled={isLoading}
                  placeholder="Search for your school..."
                />
                <p className="text-xs text-muted-foreground">
                  Can&apos;t find your school?{" "}
                  <Link href="/register" className="text-[hsl(var(--accent-violet))] hover:underline font-medium">
                    Register it here
                  </Link>
                </p>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-foreground">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder={
                    selectedRole === "platform"
                      ? "superadmin@schoolmatica.co.za"
                      : selectedRole === "school"
                      ? "admin@school.co.za"
                      : selectedRole === "smt"
                      ? "smt@school.co.za"
                      : selectedRole === "hod"
                      ? "hod@school.co.za"
                      : selectedRole === "teacher"
                      ? "teacher@school.co.za"
                      : selectedRole === "parent"
                      ? "parent@email.co.za"
                      : "student@school.co.za"
                  }
                  {...form.register("email")}
                  disabled={isLoading}
                  className="pl-10 h-11 bg-[hsl(var(--surface-soft))] border-[hsl(var(--border))] text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-[hsl(var(--accent-violet))] focus:border-[hsl(var(--accent-violet))]"
                />
              </div>
              {form.formState.errors.email && (
                <p className="text-sm text-[hsl(var(--destructive))] flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password
                </Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-[hsl(var(--accent-violet))] hover:underline font-medium"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  {...form.register("password")}
                  disabled={isLoading}
                  className="pl-10 pr-10 h-11 bg-[hsl(var(--surface-soft))] border-[hsl(var(--border))] text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-[hsl(var(--accent-violet))] focus:border-[hsl(var(--accent-violet))]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {form.formState.errors.password && (
                <p className="text-sm text-[hsl(var(--destructive))] flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="rememberMe"
                checked={form.watch("rememberMe")}
                onCheckedChange={(checked) =>
                  form.setValue("rememberMe", checked as boolean)
                }
                disabled={isLoading}
                className="border-[hsl(var(--border))] data-[state=checked]:bg-[hsl(var(--accent-violet))] data-[state=checked]:border-[hsl(var(--accent-violet))]"
              />
              <Label
                htmlFor="rememberMe"
                className="text-sm text-muted-foreground cursor-pointer"
              >
                Remember me for 30 days
              </Label>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-lg bg-[hsl(var(--destructive))]/10 border border-[hsl(var(--destructive))]/30 text-[hsl(var(--destructive))] text-sm flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-gradient-to-r from-[hsl(var(--accent-violet))] to-[hsl(var(--accent-iris))] hover:from-[hsl(var(--accent-violet))]/90 hover:to-[hsl(var(--accent-iris))]/90 text-white font-medium shadow-lg shadow-[hsl(var(--accent-violet))]/25 transition-all duration-300"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>

            {showQuickAccess && (
              <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--surface-soft))] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                    Quick access
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Password: <span className="font-medium text-foreground">Password123!</span>
                  </p>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {quickLogins.map((preset) => {
                    const roleMeta = roleOptions.find((role) => role.id === preset.role);
                    const Icon = roleMeta?.icon ?? Mail;
                    return (
                      <Button
                        key={preset.id}
                        type="button"
                        variant="outline"
                        disabled={isLoading}
                        onClick={() => handleQuickLogin(preset)}
                        className="h-auto justify-between border-[hsl(var(--border))] bg-[hsl(var(--surface-strong))] px-3 py-2 text-left hover:border-[hsl(var(--accent-violet))/0.4]"
                      >
                        <span className="flex items-center gap-3">
                          <span
                            className={cn(
                              "flex h-9 w-9 items-center justify-center rounded-xl",
                              roleMeta?.iconBg ?? "bg-[hsl(var(--accent-violet))]/10 text-[hsl(var(--accent-violet))]"
                            )}
                          >
                            <Icon className="h-4 w-4" />
                          </span>
                          <span>
                            <span className="block text-sm font-semibold text-foreground">
                              {preset.label}
                            </span>
                            <span className="block text-xs text-muted-foreground">
                              {preset.email}
                            </span>
                          </span>
                        </span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    );
                  })}
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  Demo accounts are tied to <span className="font-medium text-foreground">Nimbus Academy</span>.
                </p>
              </div>
            )}
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[hsl(var(--border))]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[hsl(var(--surface-strong))] px-3 text-muted-foreground">
                New to SchoolMatica?
              </span>
            </div>
          </div>

          {/* Register Link - Only for Schools */}
          <div className="text-center">
            {selectedRole === "platform" ? (
              <p className="text-sm text-muted-foreground">
                Platform Admin access is restricted.{" "}
                <Link href="/contact" className="text-[hsl(var(--accent-violet))] hover:underline font-medium">
                  Contact SchoolMatica
                </Link>{" "}
                for access.
              </p>
            ) : selectedRole === "school" ? (
              <Button variant="outline" asChild className="w-full h-11 border-[hsl(var(--border))] hover:bg-[hsl(var(--surface-soft))]">
                <Link href="/register">
                  Register Your School
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">
                {selectedRole === "teacher" ? (
                  <>
                    Ask your school administrator to invite you, or{" "}
                    <Link href="/register" className="text-[hsl(var(--accent-violet))] hover:underline font-medium">
                      register your school
                    </Link>
                  </>
                ) : selectedRole === "parent" ? (
                  <>
                    Parent accounts are created by the school.{" "}
                    <Link href="/contact" className="text-[hsl(var(--accent-violet))] hover:underline font-medium">
                      Contact your school
                    </Link>{" "}
                    for access.
                  </>
                ) : (
                  <>
                    Student accounts are managed by your school.{" "}
                    <Link href="/contact" className="text-[hsl(var(--accent-violet))] hover:underline font-medium">
                      Contact your school
                    </Link>{" "}
                    for access.
                  </>
                )}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Security Badge */}
      <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Shield className="h-4 w-4" />
        <span>POPIA Compliant • Secure • South African Hosted</span>
      </div>
    </div>
  );
}
