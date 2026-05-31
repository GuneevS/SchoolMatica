import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Manrope, Sora } from "next/font/google";
import { AppShell } from "@/components/layout/app-shell";
import { Providers } from "@/components/providers";
import { HydrationErrorFilter } from "@/components/hydration-error-filter";
import { getActiveSchool } from "@/lib/school";
import { getServerAuthContext } from "@/lib/auth-server";
import { type SchoolBranding } from "@/lib/branding";
import "./globals.css";

// Path prefixes that don't need the school/auth context fetched in the
// root layout. Keeping these in sync with `middleware.ts` is important.
const NO_AUTH_FETCH_PREFIXES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];

function shouldSkipAuthFetch(pathname: string | null): boolean {
  if (!pathname) return false;
  if (pathname === "/") return true;
  return NO_AUTH_FETCH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

const sora = Sora({
  variable: "--font-display",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SchoolMatica",
  description: "Assessment & moderation platform prototype",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Resolve the request pathname via the middleware-injected header. When the
  // current path is a marketing/auth page, we skip the DB-backed school +
  // auth context fetch entirely — those pages have no use for it and the
  // extra round trip slows down landing/login significantly.
  const headersList = await headers();
  const pathname = headersList.get("x-pathname");
  const skipAuthFetch = shouldSkipAuthFetch(pathname);

  let activeSchool: Awaited<ReturnType<typeof getActiveSchool>> | null = null;
  let isSuperAdmin = false;
  if (!skipAuthFetch) {
    try {
      const [school, auth] = await Promise.all([
        getActiveSchool(),
        getServerAuthContext(),
      ]);
      activeSchool = school;
      isSuperAdmin = auth?.isSuperAdmin ?? false;
    } catch (error) {
      // Database unavailable — still let the page render. The AppShell will
      // gracefully degrade.
      console.warn(
        "Database unavailable, proceeding without active school context",
        error,
      );
    }
  }
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${sora.variable} ${manrope.variable} antialiased`}>
        <HydrationErrorFilter />
        <Providers initialBranding={activeSchool?.branding as SchoolBranding | null | undefined}>
          <AppShell
            initialSchool={
              activeSchool
                ? {
                  id: activeSchool.id,
                  name: activeSchool.name,
                  shortCode: activeSchool.shortCode ?? undefined,
                }
                : null
            }
            isSuperAdmin={isSuperAdmin}
          >
            {children}
          </AppShell>
        </Providers>
      </body>
    </html>
  );
}
