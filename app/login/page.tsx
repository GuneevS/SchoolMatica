import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { UnifiedLogo } from "@/components/brand/unified-logo";

export const metadata = {
  title: "Sign In | SchoolMatica",
  description: "Sign in to access your SchoolMatica school management dashboard. South Africa's complete education platform.",
};

function LoginLoading() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--accent-violet))]" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="relative min-h-screen w-full flex flex-col bg-canvas">
      {/* Background with aurora effect - matches landing page */}
      <div className="fixed inset-0 bg-[hsl(var(--canvas))]">
        {/* Aurora gradient overlays */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute -top-[40%] -left-[20%] w-[80%] h-[80%] rounded-full opacity-30 blur-3xl animate-float"
            style={{
              background: "radial-gradient(circle, hsl(var(--accent-iris) / 0.35), transparent 60%)",
            }}
          />
          <div
            className="absolute -bottom-[30%] -right-[20%] w-[70%] h-[70%] rounded-full opacity-25 blur-3xl animate-float [animation-delay:2s]"
            style={{
              background: "radial-gradient(circle, hsl(var(--accent-violet) / 0.30), transparent 60%)",
            }}
          />
          <div
            className="absolute top-[20%] right-[10%] w-[50%] h-[50%] rounded-full opacity-20 blur-3xl animate-float [animation-delay:4s]"
            style={{
              background: "radial-gradient(circle, hsl(var(--accent-flamingo) / 0.25), transparent 60%)",
            }}
          />
        </div>
        
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
              linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)
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
            className="hover:opacity-80 transition-opacity"
          >
            <UnifiedLogo variant="full" size="sm" colorScheme="gradient" />
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
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
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>&copy; 2024 SchoolMatica. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms of Service
            </Link>
            <Link href="/contact" className="hover:text-foreground transition-colors">
              Contact Us
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
