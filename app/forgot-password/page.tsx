import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata = {
  title: "Forgot Password | SchoolMatica",
  description: "Reset your SchoolMatica account password.",
};

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4">
      <ForgotPasswordForm />
    </div>
  );
}
