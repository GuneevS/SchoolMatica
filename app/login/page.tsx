import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { Loader2 } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Sign In | SchoolMatica",
  description: "Sign in to access your SchoolMatica school management dashboard. South Africa's complete education platform.",
};

function LoginLoading() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="relative min-h-screen w-full flex flex-col">
      {/* Dark gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Subtle accent gradients */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute -top-[40%] -left-[20%] w-[80%] h-[80%] rounded-full opacity-20 blur-3xl"
            style={{
              background: "radial-gradient(circle, rgba(139, 92, 246, 0.4), transparent 60%)",
            }}
          />
          <div
            className="absolute -bottom-[30%] -right-[20%] w-[70%] h-[70%] rounded-full opacity-15 blur-3xl"
            style={{
              background: "radial-gradient(circle, rgba(59, 130, 246, 0.4), transparent 60%)",
            }}
          />
        </div>
        
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 w-full px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link 
            href="/" 
            className="flex items-center gap-2 text-xl font-bold text-white hover:opacity-80 transition-opacity"
          >
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
              <span className="text-white text-sm font-bold">SM</span>
            </div>
            SchoolMatica
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-sm text-slate-300 hover:text-white transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <Suspense fallback={<LoginLoading />}>
          <LoginForm />
        </Suspense>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full px-4 py-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>&copy; 2024 SchoolMatica. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms of Service
            </Link>
            <Link href="/contact" className="hover:text-white transition-colors">
              Contact Us
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
