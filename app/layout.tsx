import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppShell } from "@/components/layout/app-shell";
import { Providers } from "@/components/providers";
import { HydrationErrorFilter } from "@/components/hydration-error-filter";
import { getActiveSchool } from "@/lib/school";
import { getServerAuthContext } from "@/lib/auth-server";
import "./globals.css";

// Force light mode only - dark mode disabled
const themeInitScript = `
(() => {
  try {
    const root = document.documentElement;
    root.classList.remove("dark");
    root.dataset.colorMode = "light";
    window.localStorage.setItem("schoolmatica-theme", "light");
  } catch (error) {
    console.warn("theme init error", error);
  }
})();
`;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
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
    console.warn("Database unavailable, proceeding without active school context");
  }
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <HydrationErrorFilter />
        <Providers>
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
