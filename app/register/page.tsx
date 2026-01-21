import { RegisterForm } from "@/components/auth/register-form";

export const metadata = {
  title: "Register Your School | SchoolMatica",
  description: "Create your school account on SchoolMatica - the comprehensive assessment management platform for South African schools.",
};

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4">
      <RegisterForm />
    </div>
  );
}
