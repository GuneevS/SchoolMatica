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
import { Loader2, Eye, EyeOff, ArrowRight, Mail, Lock, Shield } from "lucide-react";
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
  const [showPassword, setShowPassword] = React.useState(false);
  const showQuickAccess =
    process.env.NODE_ENV !== "production" ||
    process.env.NEXT_PUBLIC_SHOW_DEMO_LOGIN === "true";

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const performLogin = React.useCallback(
    async (email: string, password: string) => {
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
          router.push(callbackUrl);
          router.refresh();
        }
      } catch {
        setError("An unexpected error occurred. Please try again.");
        setIsLoading(false);
      }
    },
    [callbackUrl, router],
  );

  const quickLogins = React.useMemo(
    () => [
      {
        id: "platform",
        label: "Platform Admin",
        role: "platform",
        email: "platform@schoolmatica.dev",
        password: "Password123!",
      },
      {
        id: "school-admin",
        label: "School Admin",
        role: "school",
        email: "admin@nimbus.edu",
        password: "Password123!",
      },
      {
        id: "hod",
        label: "HOD",
        role: "hod",
        email: "hod@nimbus.edu",
        password: "Password123!",
      },
      {
        id: "teacher",
        label: "Teacher",
        role: "teacher",
        email: "teacher@nimbus.edu",
        password: "Password123!",
      },
      {
        id: "smt",
        label: "SMT",
        role: "smt",
        email: "smt@nimbus.edu",
        password: "Password123!",
      },
      {
        id: "parent",
        label: "Parent",
        role: "parent",
        email: "parent@nimbus.edu",
        password: "Password123!",
      },
      {
        id: "student",
        label: "Student",
        role: "student",
        email: "student@nimbus.edu",
        password: "Password123!",
      },
    ],
    [],
  );

  async function onSubmit(values: FormData) {
    await performLogin(values.email, values.password);
  }

  const handleQuickLogin = async (preset: (typeof quickLogins)[number]) => {
    form.setValue("email", preset.email);
    form.setValue("password", preset.password);
    await performLogin(preset.email, preset.password);
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

      <div className="bg-white/95 backdrop-blur-xl border border-[hsl(var(--border-strong))/0.6] rounded-2xl shadow-ambient-lg p-6 sm:p-8 transition-all hover:shadow-ambient-xl duration-500 hover:border-[hsl(var(--border-strong))]">
        <form
          method="post"
          action="/login"
          onSubmit={(event) => {
            event.preventDefault();
            void form.handleSubmit(onSubmit)(event);
          }}
          className="space-y-6"
        >
          {error && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-sm text-red-600 dark:text-red-400 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
              <div className="w-1 mt-0.5 rounded bg-red-500 self-stretch" />
              <p className="font-medium">{error}</p>
            </div>
          )}

          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="font-semibold text-slate-700">Email Address</Label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-muted-foreground group-focus-within:text-[hsl(var(--accent-violet))] transition-colors">
                  <Mail className="h-4.5 w-4.5" />
                </div>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@school.co.za"
                  className={cn(
                    "pl-10 h-12 bg-slate-50 border-slate-200 rounded-xl focus:bg-white transition-all shadow-sm",
                    form.formState.errors.email && "border-red-500 focus-visible:ring-red-500"
                  )}
                  {...form.register("email")}
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>
              {form.formState.errors.email && (
                <p className="text-sm font-medium text-red-500 flex items-center gap-1.5 mt-1.5 animate-in slide-in-from-top-1">
                  <span className="h-1 w-1 rounded-full bg-red-500" />
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="font-semibold text-slate-700">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-sm font-medium text-[hsl(var(--accent-violet))] hover:text-[hsl(var(--accent-violet-dark))] hover:underline transition-colors"
                  tabIndex={-1}
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-muted-foreground group-focus-within:text-[hsl(var(--accent-violet))] transition-colors">
                  <Lock className="h-4.5 w-4.5" />
                </div>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className={cn(
                    "pl-10 pr-10 h-12 bg-slate-50 border-slate-200 rounded-xl focus:bg-white transition-all shadow-sm",
                    form.formState.errors.password && "border-red-500 focus-visible:ring-red-500"
                  )}
                  {...form.register("password")}
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-muted-foreground hover:text-foreground focus:outline-none transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                  <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                </button>
              </div>
              {form.formState.errors.password && (
                <p className="text-sm font-medium text-red-500 flex items-center gap-1.5 mt-1.5 animate-in slide-in-from-top-1">
                  <span className="h-1 w-1 rounded-full bg-red-500" />
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="remember-me"
                  checked={form.watch("rememberMe")}
                  onCheckedChange={(checked) => form.setValue("rememberMe", checked as boolean)}
                  className="h-5 w-5 rounded-md data-[state=checked]:bg-[hsl(var(--accent-violet))] data-[state=checked]:border-[hsl(var(--accent-violet))]"
                />
                <Label htmlFor="remember-me" className="text-sm font-medium cursor-pointer text-slate-700 select-none">
                  Remember me for 30 days
                </Label>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-base font-semibold rounded-xl bg-gradient-to-r from-[hsl(var(--accent-teal))] to-[hsl(var(--accent-mint))] hover:from-[hsl(var(--accent-teal-dark,210,80%,35%))] hover:to-[hsl(var(--accent-mint-dark,160,80%,40%))] text-white shadow-lg hover:shadow-xl transition-all duration-300 group mt-4 overflow-hidden relative"
            disabled={isLoading}
          >
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent shadow-[0_0_20px_white/10]" />
            
            <span className="flex items-center justify-center gap-2 relative z-10 w-full">
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1.5 transition-transform" />
                </>
              )}
            </span>
          </Button>
        </form>

        {showQuickAccess && (
          <div className="mt-8 pt-6 border-t border-slate-100 bg-slate-50/50 -mx-6 sm:-mx-8 px-6 sm:px-8 -mb-6 sm:-mb-8 pb-6 sm:pb-8 rounded-b-2xl">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold tracking-[0.2em] text-slate-500 uppercase">
                Q u i c k &nbsp; A c c e s s
              </p>
              <p className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                Password: Password123!
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {quickLogins.slice(0, 4).map((login) => {
                return (
                  <button
                    key={login.id}
                    type="button"
                    onClick={() => performLogin(login.email, login.password)}
                    disabled={isLoading}
                    className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all text-left group hover:shadow-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {login.label}
                      </p>
                      <p className="text-xs text-slate-500 font-mono truncate">
                        {login.email.split('@')[0]}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                  </button>
                );
              })}
            </div>
            
            <div className="mt-4 text-center">
              <p className="text-[11px] text-slate-500">
                Demo accounts are tied to Nimbus Academy.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Security Badge */}
      <div className="mt-8 flex items-center justify-center gap-2 text-xs font-medium text-slate-500">
        <Shield className="h-4 w-4" />
        <span>POPIA Compliant • Secure • South African Hosted</span>
      </div>
    </div>
  );
}
