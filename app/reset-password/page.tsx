import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { Loader2 } from "lucide-react";

export const metadata = {
  title: "Reset Password | SchoolMatica",
  description: "Create a new password for your SchoolMatica account.",
};

function ResetPasswordLoading() {
  return (
    <div className="flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4">
      <Suspense fallback={<ResetPasswordLoading />}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
