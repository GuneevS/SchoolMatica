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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Building2,
  User,
  Lock,
  CheckCircle2,
  MapPin,
  ArrowRight,
  ArrowLeft,
  Shield,
  AlertCircle,
  School,
} from "lucide-react";
import { UnifiedLogo } from "@/components/brand/unified-logo";

// South African Provinces
const SA_PROVINCES = [
  { value: "EC", label: "Eastern Cape" },
  { value: "FS", label: "Free State" },
  { value: "GP", label: "Gauteng" },
  { value: "KZN", label: "KwaZulu-Natal" },
  { value: "LP", label: "Limpopo" },
  { value: "MP", label: "Mpumalanga" },
  { value: "NC", label: "Northern Cape" },
  { value: "NW", label: "North West" },
  { value: "WC", label: "Western Cape" },
];

// School Types
const SCHOOL_TYPES = [
  { value: "public", label: "Public School" },
  { value: "independent", label: "Independent/Private School" },
  { value: "special", label: "Special Needs School" },
  { value: "remedial", label: "Remedial School" },
];

// School Phases
const SCHOOL_PHASES = [
  { value: "primary", label: "Primary School (Grade R-7)" },
  { value: "secondary", label: "Secondary/High School (Grade 8-12)" },
  { value: "combined", label: "Combined School (Grade R-12)" },
  { value: "intermediate", label: "Intermediate School (Grade 4-7)" },
];

const formSchema = z.object({
  // School Details
  schoolName: z.string().min(2, "School name must be at least 2 characters"),
  schoolShortCode: z.string().min(2, "Short code must be at least 2 characters").max(10, "Short code must be at most 10 characters").optional().or(z.literal("")),
  emisNumber: z.string().optional(),
  schoolType: z.string().min(1, "Please select a school type"),
  schoolPhase: z.string().min(1, "Please select a school phase"),
  province: z.string().min(1, "Please select a province"),
  district: z.string().optional(),
  
  // Admin Details
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().optional(),
  jobTitle: z.string().optional(),
  
  // Security
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  
  // Consent
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms and conditions",
  }),
  acceptPopia: z.boolean().refine((val) => val === true, {
    message: "You must accept the POPIA consent",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof formSchema>;

const steps = [
  { num: 1, label: "School", description: "School details", icon: Building2 },
  { num: 2, label: "Location", description: "Province & district", icon: MapPin },
  { num: 3, label: "Admin", description: "Your account", icon: User },
  { num: 4, label: "Security", description: "Password & consent", icon: Lock },
];

export function RegisterForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [step, setStep] = React.useState<1 | 2 | 3 | 4>(1);
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
      emisNumber: "",
      schoolType: "",
      schoolPhase: "",
      province: "",
      district: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      jobTitle: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
      acceptPopia: false,
    },
    mode: "onChange",
  });

  const { watch, trigger, formState: { errors }, setValue } = form;

  async function validateStep(currentStep: number): Promise<boolean> {
    switch (currentStep) {
      case 1:
        return await trigger(["schoolName", "schoolType", "schoolPhase"]);
      case 2:
        return await trigger(["province"]);
      case 3:
        return await trigger(["firstName", "lastName", "email"]);
      case 4:
        return await trigger(["password", "confirmPassword", "acceptTerms", "acceptPopia"]);
      default:
        return true;
    }
  }

  async function nextStep() {
    const isValid = await validateStep(step);
    if (isValid && step < 4) {
      setStep((s) => (s + 1) as 1 | 2 | 3 | 4);
    }
  }

  function prevStep() {
    if (step > 1) {
      setStep((s) => (s - 1) as 1 | 2 | 3 | 4);
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

  // Success state
  if (isComplete && registeredData) {
    return (
      <div className="w-full max-w-lg mx-auto">
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/10 via-green-500/10 to-teal-500/10 rounded-3xl blur-xl" />
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl p-8 text-center">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/25">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Welcome to SchoolMatica!
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Your school has been successfully registered
            </p>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 mb-6 text-left">
              <div className="flex items-center gap-3 mb-3">
                <School className="h-5 w-5 text-violet-500" />
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">School</p>
                  <p className="font-medium text-slate-900 dark:text-white">{registeredData.schoolName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-violet-500" />
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Administrator</p>
                  <p className="font-medium text-slate-900 dark:text-white">{registeredData.email}</p>
                </div>
              </div>
            </div>
            <Button
              className="w-full h-11 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white"
              onClick={() => router.push("/login")}
            >
              Sign In to Your Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="flex justify-center mb-4">
          <UnifiedLogo variant="icon" size="lg" />
        </div>
        <h1 className="text-2xl font-bold text-white dark:text-white">
          Register Your School
        </h1>
        <p className="text-slate-300 dark:text-slate-400 mt-1">
          Join South Africa&apos;s leading school management platform
        </p>
      </div>

      {/* Step Indicator */}
      <div className="mb-6">
        <div className="flex items-center justify-between relative">
          {/* Progress Line */}
          <div className="absolute left-0 right-0 top-5 h-0.5 bg-slate-600" />
          <div
            className="absolute left-0 top-5 h-0.5 bg-gradient-to-r from-violet-500 to-purple-600 transition-all duration-500"
            style={{ width: `${((step - 1) / 3) * 100}%` }}
          />
          
          {steps.map((s) => {
            const Icon = s.icon;
            const isActive = step === s.num;
            const isCompleted = step > s.num;

            return (
              <div key={s.num} className="relative z-10 flex flex-col items-center">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                    isCompleted
                      ? "bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-md"
                      : isActive
                      ? "bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg ring-4 ring-violet-500/30"
                      : "bg-slate-700 text-slate-400 border border-slate-600"
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>
                <span className={cn(
                  "text-xs mt-2 font-medium hidden sm:block",
                  isActive || isCompleted ? "text-white" : "text-slate-400"
                )}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Form Card - SOLID BACKGROUND */}
      <div className="relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-pink-500/10 rounded-3xl blur-xl" />
        <div className="relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl p-6 sm:p-8">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            
            {/* Step 1: School Details */}
            <div className={cn("space-y-4", step !== 1 && "hidden")}>
              <div className="space-y-2">
                <Label htmlFor="schoolName" className="flex items-center gap-1 text-slate-700 dark:text-slate-200">
                  School Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="schoolName"
                  placeholder="e.g., Pretoria High School for Girls"
                  {...form.register("schoolName")}
                  disabled={isLoading}
                  className="h-11 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white"
                />
                {errors.schoolName && (
                  <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.schoolName.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="schoolShortCode" className="text-slate-700 dark:text-slate-200">Short Code</Label>
                  <Input
                    id="schoolShortCode"
                    placeholder="e.g., PHSG"
                    maxLength={10}
                    {...form.register("schoolShortCode")}
                    disabled={isLoading}
                    className="h-11 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emisNumber" className="text-slate-700 dark:text-slate-200">EMIS Number</Label>
                  <Input
                    id="emisNumber"
                    placeholder="e.g., 700000000"
                    {...form.register("emisNumber")}
                    disabled={isLoading}
                    className="h-11 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    DBE school identifier (optional)
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-slate-200">School Type <span className="text-red-500">*</span></Label>
                <Select
                  value={watch("schoolType")}
                  onValueChange={(value) => setValue("schoolType", value)}
                  disabled={isLoading}
                >
                  <SelectTrigger className="h-11 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white">
                    <SelectValue placeholder="Select school type" />
                  </SelectTrigger>
                  <SelectContent>
                    {SCHOOL_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.schoolType && (
                  <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.schoolType.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-slate-200">School Phase <span className="text-red-500">*</span></Label>
                <Select
                  value={watch("schoolPhase")}
                  onValueChange={(value) => setValue("schoolPhase", value)}
                  disabled={isLoading}
                >
                  <SelectTrigger className="h-11 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white">
                    <SelectValue placeholder="Select school phase" />
                  </SelectTrigger>
                  <SelectContent>
                    {SCHOOL_PHASES.map((phase) => (
                      <SelectItem key={phase.value} value={phase.value}>
                        {phase.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.schoolPhase && (
                  <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.schoolPhase.message}
                  </p>
                )}
              </div>
            </div>

            {/* Step 2: Location */}
            <div className={cn("space-y-4", step !== 2 && "hidden")}>
              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-slate-200">Province <span className="text-red-500">*</span></Label>
                <Select
                  value={watch("province")}
                  onValueChange={(value) => setValue("province", value)}
                  disabled={isLoading}
                >
                  <SelectTrigger className="h-11 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white">
                    <SelectValue placeholder="Select your province" />
                  </SelectTrigger>
                  <SelectContent>
                    {SA_PROVINCES.map((province) => (
                      <SelectItem key={province.value} value={province.value}>
                        {province.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.province && (
                  <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.province.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="district" className="text-slate-700 dark:text-slate-200">Education District (optional)</Label>
                <Input
                  id="district"
                  placeholder="e.g., Tshwane North"
                  {...form.register("district")}
                  disabled={isLoading}
                  className="h-11 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Your school&apos;s education district
                </p>
              </div>

              <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 mt-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      South African Schools
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      SchoolMatica is designed specifically for South African schools,
                      with full CAPS curriculum alignment and DBE compliance features.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Admin Details */}
            <div className={cn("space-y-4", step !== 3 && "hidden")}>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-slate-700 dark:text-slate-200">
                    First Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    {...form.register("firstName")}
                    disabled={isLoading}
                    className="h-11 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white"
                  />
                  {errors.firstName && (
                    <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.firstName.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-slate-700 dark:text-slate-200">
                    Last Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    placeholder="Smith"
                    {...form.register("lastName")}
                    disabled={isLoading}
                    className="h-11 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white"
                  />
                  {errors.lastName && (
                    <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 dark:text-slate-200">
                  Email Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@school.co.za"
                  {...form.register("email")}
                  disabled={isLoading}
                  className="h-11 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  This will be your login email
                </p>
                {errors.email && (
                  <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-slate-700 dark:text-slate-200">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="012 345 6789"
                    {...form.register("phone")}
                    disabled={isLoading}
                    className="h-11 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jobTitle" className="text-slate-700 dark:text-slate-200">Job Title</Label>
                  <Input
                    id="jobTitle"
                    placeholder="e.g., Principal"
                    {...form.register("jobTitle")}
                    disabled={isLoading}
                    className="h-11 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Step 4: Security & Consent */}
            <div className={cn("space-y-4", step !== 4 && "hidden")}>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-700 dark:text-slate-200">
                  Password <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Minimum 8 characters"
                  {...form.register("password")}
                  disabled={isLoading}
                  className="h-11 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white"
                />
                {errors.password && (
                  <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-slate-700 dark:text-slate-200">
                  Confirm Password <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Re-enter your password"
                  {...form.register("confirmPassword")}
                  disabled={isLoading}
                  className="h-11 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white"
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {/* Consent Checkboxes */}
              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <Checkbox
                    id="acceptTerms"
                    checked={watch("acceptTerms")}
                    onCheckedChange={(checked) => setValue("acceptTerms", checked as boolean)}
                    disabled={isLoading}
                    className="mt-1 border-slate-300 dark:border-slate-600"
                  />
                  <div className="flex-1">
                    <Label htmlFor="acceptTerms" className="cursor-pointer text-sm font-normal text-slate-700 dark:text-slate-300">
                      I accept the{" "}
                      <Link href="/terms" className="text-violet-600 dark:text-violet-400 hover:underline">
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link href="/privacy" className="text-violet-600 dark:text-violet-400 hover:underline">
                        Privacy Policy
                      </Link>
                      <span className="text-red-500"> *</span>
                    </Label>
                  </div>
                </div>
                {errors.acceptTerms && (
                  <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1 ml-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.acceptTerms.message}
                  </p>
                )}

                <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <Checkbox
                    id="acceptPopia"
                    checked={watch("acceptPopia")}
                    onCheckedChange={(checked) => setValue("acceptPopia", checked as boolean)}
                    disabled={isLoading}
                    className="mt-1 border-slate-300 dark:border-slate-600"
                  />
                  <div className="flex-1">
                    <Label htmlFor="acceptPopia" className="cursor-pointer text-sm font-normal text-slate-700 dark:text-slate-300">
                      I consent to the processing of personal information in accordance with{" "}
                      <Link href="/popia" className="text-violet-600 dark:text-violet-400 hover:underline">
                        POPIA
                      </Link>
                      <span className="text-red-500"> *</span>
                    </Label>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Protection of Personal Information Act compliance
                    </p>
                  </div>
                </div>
                {errors.acceptPopia && (
                  <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1 ml-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.acceptPopia.message}
                  </p>
                )}
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex gap-3 pt-4">
              {step > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={isLoading}
                  className="flex-1 h-11 border-slate-200 dark:border-slate-700"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              )}
              {step < 4 ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  disabled={isLoading}
                  className="flex-1 h-11 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white"
                >
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 h-11 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Create School Account
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>

          {/* Sign In Link */}
          <div className="mt-6 text-center border-t border-slate-200 dark:border-slate-700 pt-6">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Already have an account?{" "}
              <Link href="/login" className="text-violet-600 dark:text-violet-400 hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Security Badge */}
      <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400 dark:text-slate-500">
        <Shield className="h-4 w-4" />
        <span>POPIA Compliant • 256-bit SSL • South African Hosted</span>
      </div>
    </div>
  );
}
