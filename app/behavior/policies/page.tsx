import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAuth, getAuthorizedActiveSchool } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Award, AlertTriangle, Settings, Loader2 } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Behaviour Policies | SchoolMatica",
  description: "Configure merit and demerit policies for your school.",
};

async function getPolicies(schoolId: string) {
  return prisma.behaviorPolicy.findMany({
    where: { schoolId },
    orderBy: [{ type: "asc" }, { category: "asc" }],
  });
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

export default async function PoliciesPage() {
  await requireAuth();
  const school = await getAuthorizedActiveSchool();

  if (!school) {
    redirect("/dashboard");
  }

  const policies = await getPolicies(school.id);
  const meritPolicies = policies.filter((p) => p.type === "Merit");
  const demeritPolicies = policies.filter((p) => p.type === "Demerit");

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/behavior">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Behaviour Policies</h1>
            <p className="text-muted-foreground mt-1">
              Configure merit and demerit categories with thresholds and consequences.
            </p>
          </div>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Policy
        </Button>
      </div>

      <Suspense fallback={<LoadingState />}>
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Merit Policies */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-emerald-500" />
                Merit Policies
              </CardTitle>
              <CardDescription>
                Categories and rewards for positive behaviour
              </CardDescription>
            </CardHeader>
            <CardContent>
              {meritPolicies.length === 0 ? (
                <div className="text-center py-8">
                  <Award className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground mb-4">
                    No merit policies configured yet
                  </p>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Merit Policy
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {meritPolicies.map((policy) => (
                    <div
                      key={policy.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20"
                    >
                      <div>
                        <p className="font-medium">{policy.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {policy.category} • {policy.defaultPoints} points
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={policy.isActive ? "default" : "secondary"}
                          className={policy.isActive ? "bg-emerald-500" : ""}
                        >
                          {policy.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <Button variant="ghost" size="icon">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Demerit Policies */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Demerit Policies
              </CardTitle>
              <CardDescription>
                Categories and consequences for negative behaviour
              </CardDescription>
            </CardHeader>
            <CardContent>
              {demeritPolicies.length === 0 ? (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground mb-4">
                    No demerit policies configured yet
                  </p>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Demerit Policy
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {demeritPolicies.map((policy) => (
                    <div
                      key={policy.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-amber-500/10 border border-amber-500/20"
                    >
                      <div>
                        <p className="font-medium">{policy.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {policy.category} • {policy.defaultPoints} points
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={policy.isActive ? "default" : "secondary"}
                          className={policy.isActive ? "bg-amber-500" : ""}
                        >
                          {policy.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <Button variant="ghost" size="icon">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Threshold Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Threshold Configuration</CardTitle>
            <CardDescription>
              Define automatic actions when students reach certain point thresholds
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="p-4 rounded-lg bg-muted/50 border">
                <p className="text-2xl font-bold text-amber-500">10</p>
                <p className="text-sm font-medium">Warning Level</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Send notification to parents
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 border">
                <p className="text-2xl font-bold text-orange-500">20</p>
                <p className="text-sm font-medium">Detention Level</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Auto-schedule detention
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 border">
                <p className="text-2xl font-bold text-red-500">30</p>
                <p className="text-sm font-medium">Suspension Level</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Flag for disciplinary action
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 border">
                <p className="text-2xl font-bold text-emerald-500">50</p>
                <p className="text-sm font-medium">Merit Reward</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Certificate of recognition
                </p>
              </div>
            </div>
            <div className="mt-4">
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Configure Thresholds
              </Button>
            </div>
          </CardContent>
        </Card>
      </Suspense>
    </div>
  );
}
