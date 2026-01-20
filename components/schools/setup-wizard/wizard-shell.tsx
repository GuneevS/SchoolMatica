"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { wizardSchema, WizardValues, defaultWizardValues, DEFAULT_GRADES, DEFAULT_GRADING_BANDS, generateClassNames, NamingPattern } from "./wizard-types";
import { StepIdentity } from "./step-identity";
import { StepGrades } from "./step-grades";
import { StepClasses } from "./step-classes";
import { StepStaff } from "./step-staff";
import { Plus, CheckCircle2, Loader2, AlertCircle, School, GraduationCap, Users, UserPlus } from "lucide-react";

const STEPS = [
    { id: "identity", label: "School Identity", icon: School },
    { id: "grades", label: "Grade Levels", icon: GraduationCap },
    { id: "classes", label: "Class Structure", icon: Users },
    { id: "staff", label: "Staff", icon: UserPlus },
];

export function SchoolSetupWizard() {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState(0);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const methods = useForm<WizardValues>({
        resolver: zodResolver(wizardSchema),
        defaultValues: defaultWizardValues,
        mode: "onChange"
    });

    const { handleSubmit, trigger, watch, formState: { isValid, errors } } = methods;
    const selectedGrades = watch("selectedGrades") || [];

    const resetWizard = () => {
        setStep(0);
        setError(null);
        setSuccess(false);
        methods.reset(defaultWizardValues);
    };

    const nextStep = async () => {
        // Validate current step
        let fieldsToValidate: (keyof WizardValues)[] = [];
        
        switch (step) {
            case 0:
                fieldsToValidate = ["name"];
                break;
            case 1:
                fieldsToValidate = ["selectedGrades"];
                break;
            case 2:
                // Classes are optional, auto-fill defaults
                break;
            case 3:
                // Staff is optional
                break;
        }

        if (fieldsToValidate.length > 0) {
            const valid = await trigger(fieldsToValidate);
            if (!valid) return;
        }

        if (step < STEPS.length - 1) {
            setStep(s => s + 1);
        }
    };

    const prevStep = () => {
        if (step > 0) setStep(s => s - 1);
    };

    const createSchool = async (data: WizardValues) => {
        setError(null);
        
        startTransition(async () => {
            try {
                // 1. Create the school with grading config
                const schoolResponse = await fetch("/api/schools", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name: data.name,
                        shortCode: data.shortCode || undefined,
                        gradingName: `${data.name} Grading`,
                        phases: DEFAULT_GRADING_BANDS,
                    }),
                });

                if (!schoolResponse.ok) {
                    const errorData = await schoolResponse.json();
                    throw new Error(errorData.error || "Failed to create school");
                }

                const school = await schoolResponse.json();

                // 2. Use the bulk setup endpoint to create grades, classes, and teachers
                const gradeLevels = data.selectedGrades.map((gradeId) => {
                    const gradeInfo = DEFAULT_GRADES.find(g => g.id === gradeId);
                    return {
                        name: gradeInfo?.label || `Grade ${gradeId}`,
                        gradeId,
                        order: gradeInfo?.order ?? 0,
                    };
                });

                // Generate class names
                const classes: { name: string; gradeId: string }[] = [];
                for (const gradeId of data.selectedGrades) {
                    const config = data.classesPerGrade?.[gradeId] || { count: 1, namingPattern: "ALPHA" as NamingPattern };
                    const classNames = generateClassNames(gradeId, config.count, config.namingPattern);
                    for (const className of classNames) {
                        classes.push({ name: className, gradeId });
                    }
                }

                // Transform teacher invites
                const teachers = (data.staffInvites || []).map(invite => ({
                    firstName: invite.firstName,
                    lastName: invite.lastName,
                    email: invite.email,
                    role: invite.role === "hod" ? "HOD" : 
                          invite.role === "smt" ? "SMT" : 
                          invite.role === "admin" ? "Admin" : "Teacher",
                }));

                // Call the setup endpoint
                const setupResponse = await fetch(`/api/schools/${school.id}/setup`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        gradeLevels,
                        classes,
                        teachers: teachers.length > 0 ? teachers : undefined,
                        updateGradingConfig: true,
                    }),
                });

                if (!setupResponse.ok) {
                    const errorData = await setupResponse.json();
                    throw new Error(errorData.error || "Failed to setup school");
                }

                setSuccess(true);
                
                // Wait a moment then close and refresh
                setTimeout(() => {
                    setOpen(false);
                    resetWizard();
                    router.refresh();
                }, 2000);

            } catch (err) {
                console.error("Failed to create school:", err);
                setError(err instanceof Error ? err.message : "Failed to create school. Please try again.");
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) resetWizard();
        }}>
            <DialogTrigger asChild>
                <Button size="lg" className="shadow-lg bg-gradient-to-r from-[hsl(var(--accent-iris))] to-[hsl(var(--accent-violet))] text-white hover:opacity-90 transition-opacity">
                    <Plus className="mr-2 h-4 w-4" /> New School
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <School className="h-5 w-5" />
                        Setup New School
                    </DialogTitle>
                    <DialogDescription>
                        Create a new school with grades, classes, and staff
                    </DialogDescription>
                    
                    {/* Step Indicator */}
                    <div className="flex gap-2 mt-4">
                        {STEPS.map((s, i) => {
                            const Icon = s.icon;
                            const isActive = i === step;
                            const isComplete = i < step;
                            
                            return (
                                <div key={s.id} className="flex-1">
                                    <div className={`
                                        h-1 rounded-full transition-colors mb-2
                                        ${isComplete ? "bg-emerald-500" : isActive ? "bg-primary" : "bg-muted"}
                                    `} />
                                    <div className={`
                                        flex items-center gap-1.5 text-xs
                                        ${isActive ? "text-primary font-medium" : "text-muted-foreground"}
                                    `}>
                                        <Icon className="h-3.5 w-3.5" />
                                        <span className="hidden sm:inline">{s.label}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </DialogHeader>

                <FormProvider {...methods}>
                    <form onSubmit={handleSubmit(createSchool)} className="flex-1 overflow-y-auto min-h-0">
                        {/* Error Alert */}
                        {error && (
                            <Alert variant="destructive" className="mb-4">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        {/* Success Alert */}
                        {success && (
                            <Alert className="mb-4 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200">
                                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                <AlertDescription className="text-emerald-800 dark:text-emerald-200">
                                    School created successfully! Redirecting...
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Step Content */}
                        <div className="min-h-[350px]">
                            {step === 0 && <StepIdentity />}
                            {step === 1 && <StepGrades />}
                            {step === 2 && <StepClasses />}
                            {step === 3 && <StepStaff />}
                        </div>
                    </form>
                </FormProvider>

                <DialogFooter className="mt-auto border-t pt-4 flex-shrink-0">
                    <div className="flex items-center justify-between w-full">
                        <Button 
                            type="button"
                            variant="ghost" 
                            onClick={prevStep} 
                            disabled={step === 0 || isPending}
                        >
                            Back
                        </Button>
                        
                        <div className="flex gap-2">
                            {step < STEPS.length - 1 ? (
                                <Button type="button" onClick={nextStep} disabled={isPending}>
                                    Next
                                </Button>
                            ) : (
                                <Button 
                                    type="button"
                                    onClick={handleSubmit(createSchool)} 
                                    disabled={isPending || selectedGrades.length === 0}
                                    className="bg-emerald-600 hover:bg-emerald-700"
                                >
                                    {isPending ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Creating School...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="mr-2 h-4 w-4" />
                                            Create School
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
