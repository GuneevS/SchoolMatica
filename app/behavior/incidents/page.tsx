import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAuth, getAuthorizedActiveSchool } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Plus, Award, AlertTriangle, Search, Filter, Loader2, Calendar } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Behaviour Incidents | SchoolMatica",
  description: "View and manage all behaviour incidents.",
};

async function getIncidents(schoolId: string) {
  return prisma.behaviorIncident.findMany({
    where: { schoolId },
    include: {
      student: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          admissionNumber: true,
          classGroup: {
            select: {
              name: true,
            },
          },
        },
      },
      issuedBy: {
        select: {
          displayName: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

export default async function IncidentsPage() {
  await requireAuth();
  const school = await getAuthorizedActiveSchool();

  if (!school) {
    redirect("/dashboard");
  }

  const incidents = await getIncidents(school.id);

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
            <h1 className="text-3xl font-bold tracking-tight">Behaviour Incidents</h1>
            <p className="text-muted-foreground mt-1">
              View and manage all merit and demerit records.
            </p>
          </div>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Incident
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search by student name..." className="pl-10" />
              </div>
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Merit">Merits</SelectItem>
                <SelectItem value="Demerit">Demerits</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Academic">Academic</SelectItem>
                <SelectItem value="Conduct">Conduct</SelectItem>
                <SelectItem value="Service">Service</SelectItem>
                <SelectItem value="Leadership">Leadership</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              Date Range
            </Button>
          </div>
        </CardContent>
      </Card>

      <Suspense fallback={<LoadingState />}>
        {incidents.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Award className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No incidents recorded</h3>
              <p className="text-muted-foreground mb-4">
                Start tracking student behaviour by recording merits and demerits.
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Record First Incident
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {incidents.map((incident) => (
              <Card key={incident.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-stretch">
                    {/* Type indicator */}
                    <div
                      className={`w-2 ${
                        incident.type === "Merit"
                          ? "bg-emerald-500"
                          : "bg-amber-500"
                      }`}
                    />
                    
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-10 w-10 rounded-full flex items-center justify-center ${
                              incident.type === "Merit"
                                ? "bg-emerald-500/20"
                                : "bg-amber-500/20"
                            }`}
                          >
                            {incident.type === "Merit" ? (
                              <Award
                                className={`h-5 w-5 ${
                                  incident.type === "Merit"
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : "text-amber-600 dark:text-amber-400"
                                }`}
                              />
                            ) : (
                              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                            )}
                          </div>
                          <div>
                            <Link
                              href={`/students/${incident.student.id}`}
                              className="font-medium hover:underline"
                            >
                              {incident.student.firstName} {incident.student.lastName}
                            </Link>
                            <p className="text-sm text-muted-foreground">
                              {incident.student.classGroup.name} • {incident.student.admissionNumber}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <Badge
                            className={
                              incident.type === "Merit"
                                ? "bg-emerald-500 hover:bg-emerald-600"
                                : "bg-amber-500 hover:bg-amber-600 text-white"
                            }
                          >
                            {incident.type === "Merit" ? "+" : "-"}{incident.points} pts
                          </Badge>
                          <Badge variant="outline">{incident.category}</Badge>
                        </div>
                      </div>
                      
                      <div className="mt-3 pl-13">
                        <p className="text-sm">{incident.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>
                            By {incident.issuedBy.displayName}
                          </span>
                          <span>•</span>
                          <span>
                            {new Date(incident.date).toLocaleDateString("en-ZA", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {incident.status !== "Active" && (
                            <>
                              <span>•</span>
                              <Badge variant="secondary" className="text-xs">
                                {incident.status}
                              </Badge>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </Suspense>
    </div>
  );
}
