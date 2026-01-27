import { redirect } from "next/navigation";
import { getServerAuthContext, requireAuth } from "@/lib/auth-server";
import { ParentShell } from "@/components/parent/parent-shell";

export default async function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await getServerAuthContext();

  if (!auth) {
    redirect("/login?callbackUrl=/parent");
  }

  // TODO: Verify user has parent role
  // For now, allow access

  return (
    <ParentShell
      user={{
        id: auth.user.id,
        email: auth.user.email || "",
        displayName: auth.user.displayName,
      }}
    >
      {children}
    </ParentShell>
  );
}
