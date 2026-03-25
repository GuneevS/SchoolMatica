import type { Metadata } from "next";
import { Manrope, Sora } from "next/font/google";
import { AppShell } from "@/components/layout/app-shell";
import { Providers } from "@/components/providers";
import { HydrationErrorFilter } from "@/components/hydration-error-filter";
import { getActiveSchool } from "@/lib/school";
import { getServerAuthContext } from "@/lib/auth-server";
import { type SchoolBranding } from "@/lib/branding";
import "./globals.css";

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Attempt to get active school and auth context, but gracefully handle database unavailability
  // This allows marketing pages (like landing page) to render even without DB
  let activeSchool = null;
  let isSuperAdmin = false;
  try {
    const [school, auth] = await Promise.all([
      getActiveSchool(),
      getServerAuthContext(),
    ]);
    activeSchool = school;
    isSuperAdmin = auth?.isSuperAdmin ?? false;
  } catch (error) {
    // Database unavailable - this is fine for marketing pages
    console.warn("Database unavailable, proceeding without active school context", error);
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
