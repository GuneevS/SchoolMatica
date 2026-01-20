"use client";

import { SchoolSetupWizard } from "@/components/schools/setup-wizard/wizard-shell";

export default function NewSchoolPage() {
    return (
        <div className="container mx-auto py-8 max-w-4xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold">Create New School</h1>
                <p className="text-muted-foreground mt-2">
                    Set up a new school with grade levels, classes, and staff in just a few steps.
                </p>
            </div>
            <div className="flex justify-center">
                <SchoolSetupWizard />
            </div>
        </div>
    );
}
