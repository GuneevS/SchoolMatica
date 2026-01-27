import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Award,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Calendar,
  ChevronRight,
} from "lucide-react";

export const metadata = {
  title: "Behaviour | SchoolMatica Parent Portal",
  description: "View your children's merit and demerit records.",
};

// Mock data
const mockChildrenBehavior = [
  {
    id: "1",
    name: "Thabo Mokoena",
    grade: "Grade 10",
    meritTotal: 15,
    demeritTotal: 2,
    netBalance: 13,
    recentIncidents: [
      {
        type: "Merit",
        points: 5,
        category: "Academic",
        description: "Excellence in Mathematics test",
        date: "2024-02-15",
        issuedBy: "Mr. Nkosi",
      },
      {
        type: "Demerit",
        points: 2,
        category: "Conduct",
        description: "Late to class",
        date: "2024-02-10",
        issuedBy: "Mrs. van der Berg",
      },
      {
        type: "Merit",
        points: 3,
        category: "Service",
        description: "Helped organise library books",
        date: "2024-02-05",
        issuedBy: "Mrs. Molapo",
      },
    ],
  },
  {
    id: "2",
    name: "Naledi Mokoena",
    grade: "Grade 7",
    meritTotal: 22,
    demeritTotal: 0,
    netBalance: 22,
    recentIncidents: [
      {
        type: "Merit",
        points: 5,
        category: "Leadership",
        description: "Excellent class representative work",
        date: "2024-02-18",
        issuedBy: "Mrs. Molapo",
      },
      {
        type: "Merit",
        points: 5,
        category: "Service",
        description: "Community service participation",
        date: "2024-02-12",
        issuedBy: "Mr. Dlamini",
      },
      {
        type: "Merit",
        points: 3,
        category: "Academic",
        description: "Perfect attendance this term",
        date: "2024-02-01",
        issuedBy: "Mrs. Molapo",
      },
    ],
  },
];

export default function BehaviorPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Behaviour Records</h1>
          <p className="text-muted-foreground mt-1">
            Track your children&apos;s merit and demerit points.
          </p>
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select child" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Children</SelectItem>
            <SelectItem value="1">Thabo Mokoena</SelectItem>
            <SelectItem value="2">Naledi Mokoena</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {mockChildrenBehavior.map((child) => (
        <Card key={child.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{child.name}</CardTitle>
                <CardDescription>{child.grade}</CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="flex items-center gap-1">
                    <Award className="h-4 w-4 text-emerald-500" />
                    <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {child.meritTotal}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">Merits</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                      {child.demeritTotal}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">Demerits</p>
                </div>
                <div className="text-center px-4 py-2 rounded-lg bg-muted/50">
                  <span className="text-2xl font-bold">
                    {child.netBalance >= 0 ? "+" : ""}{child.netBalance}
                  </span>
                  <p className="text-xs text-muted-foreground">Net Balance</p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Recent Activity
            </h4>
            <div className="space-y-3">
              {child.recentIncidents.map((incident, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-4 p-4 rounded-lg ${
                    incident.type === "Merit"
                      ? "bg-emerald-500/10"
                      : "bg-amber-500/10"
                  }`}
                >
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      incident.type === "Merit"
                        ? "bg-emerald-500/20"
                        : "bg-amber-500/20"
                    }`}
                  >
                    {incident.type === "Merit" ? (
                      <Award className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{incident.description}</p>
                      <Badge
                        className={
                          incident.type === "Merit"
                            ? "bg-emerald-500"
                            : "bg-amber-500"
                        }
                      >
                        {incident.type === "Merit" ? "+" : "-"}{incident.points}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {incident.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        by {incident.issuedBy}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        • {new Date(incident.date).toLocaleDateString("en-ZA", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Threshold Information */}
      <Card>
        <CardHeader>
          <CardTitle>Understanding Behaviour Points</CardTitle>
          <CardDescription>
            How the merit and demerit system works at your school
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <Award className="h-5 w-5" />
                Merit Rewards
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between p-2 rounded bg-muted/30">
                  <span>25+ points</span>
                  <span className="text-muted-foreground">Bronze Certificate</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-muted/30">
                  <span>50+ points</span>
                  <span className="text-muted-foreground">Silver Certificate</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-muted/30">
                  <span>100+ points</span>
                  <span className="text-muted-foreground">Gold Certificate</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-5 w-5" />
                Demerit Consequences
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between p-2 rounded bg-muted/30">
                  <span>10 points</span>
                  <span className="text-muted-foreground">Parent Notification</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-muted/30">
                  <span>20 points</span>
                  <span className="text-muted-foreground">Detention</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-muted/30">
                  <span>30+ points</span>
                  <span className="text-muted-foreground">Disciplinary Meeting</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
