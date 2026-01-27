import { redirect } from "next/navigation";
import { getServerAuthContext } from "@/lib/auth-server";
import { SuperAdminShell } from "@/components/super-admin/super-admin-shell";

export const metadata = {
  title: "Super Admin | SchoolMatica",
  description: "Platform administration and school management",
};

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await getServerAuthContext();

  // Redirect if not authenticated
  if (!auth) {
    redirect("/login?callbackUrl=/super-admin");
  }

  // Redirect if not a super admin
  if (!auth.isSuperAdmin) {
    redirect("/dashboard");
  }

  return (
    <SuperAdminShell user={auth.user}>
      {children}
    </SuperAdminShell>
  );
}
