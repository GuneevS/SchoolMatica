"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useRoleStore } from "@/lib/stores/role-store";
import { formatDateReadable } from "@/lib/date-utils";

const statusFilters = ["All", "Submitted", "InReview", "Approved", "Rejected"] as const;
const statusTone: Record<string, string> = {
  Draft: "bg-slate-100 text-slate-600",
  Submitted: "bg-amber-100 text-amber-700",
  InReview: "bg-blue-100 text-blue-700",
  Approved: "bg-emerald-100 text-emerald-700",
  Rejected: "bg-rose-100 text-rose-700",
};

const registrationSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  birthDate: z.string().optional(),
  gender: z.string().optional(),
  guardianName: z.string().min(2),
  guardianContact: z.string().min(3),
  guardianEmail: z.string().email().optional(),
  classGroupId: z.string().optional(),
});

type RegistrationFormValues = z.infer<typeof registrationSchema>;

type RegistrationRecord = {
  id: string;
  status: string;
  learnerData: Record<string, unknown>;
  guardianData: Record<string, unknown>;
  supportingDocs: Record<string, unknown> | null;
  classGroup: { id: string; name: string } | null;
  student: { id: string; admissionNumber: string } | null;
  createdAt: string;
  decidedAt: string | null;
  decisionNote: string | null;
};

type ClassOption = {
  id: string;
  name: string;
};

interface Props {
  schoolId: string;
  registrations: RegistrationRecord[];
  classes: ClassOption[];
}

export function RegistrationManager({ schoolId, registrations, classes }: Props) {
  const role = useRoleStore((state) => state.role);
  const router = useRouter();
  const [filter, setFilter] = useState<(typeof statusFilters)[number]>("All");
  const [selectedClasses, setSelectedClasses] = useState<Record<string, string>>({});
  const [decisionNotes, setDecisionNotes] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const form = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      birthDate: "",
      gender: "",
      guardianName: "",
      guardianContact: "",
      guardianEmail: "",
      classGroupId: classes[0]?.id ?? "",
    },
  });
  const [preferredClassValue, setPreferredClassValue] = useState(form.getValues("classGroupId") ?? "");

  const filteredRegistrations = useMemo(() => {
    if (filter === "All") return registrations;
    return registrations.filter((registration) => registration.status === filter);
  }, [filter, registrations]);

  function mutateRegistration(id: string, payload: Record<string, unknown>) {
    startTransition(async () => {
      await fetch(`/api/registrations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, actorRole: role }),
      });
      router.refresh();
    });
  }

  function handleCreate(values: RegistrationFormValues) {
    startTransition(async () => {
      await fetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolId,
          classGroupId: values.classGroupId || undefined,
          learnerData: {
            firstName: values.firstName,
            lastName: values.lastName,
            birthDate: values.birthDate,
            gender: values.gender,
          },
          guardianData: {
            guardianName: values.guardianName,
            contactNumber: values.guardianContact,
            email: values.guardianEmail,
          },
        }),
      });
      setCreateDialogOpen(false);
      form.reset();
      setPreferredClassValue(classes[0]?.id ?? "");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Tabs value={filter} onValueChange={(value) => setFilter(value as (typeof statusFilters)[number])}>
          <TabsList className="flex flex-wrap gap-2">
            {statusFilters.map((status) => (
              <TabsTrigger key={status} value={status} className="px-4">
                {status}
              </TabsTrigger>
            ))}
          </TabsList>
          {statusFilters.map((status) => (
            <TabsContent key={status} value={status} />
          ))}
        </Tabs>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">Capture registration</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New learner registration</DialogTitle>
            </DialogHeader>
            <form className="space-y-4" onSubmit={form.handleSubmit(handleCreate)}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <Label>First name</Label>
                  <Input {...form.register("firstName")} />
                </div>
                <div className="space-y-1">
                  <Label>Last name</Label>
                  <Input {...form.register("lastName")} />
                </div>
                <div className="space-y-1">
                  <Label>Birth date</Label>
                  <Input type="date" {...form.register("birthDate")} />
                </div>
                <div className="space-y-1">
                  <Label>Gender</Label>
                  <Input {...form.register("gender")} />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <Label>Guardian name</Label>
                  <Input {...form.register("guardianName")} />
                </div>
                <div className="space-y-1">
                  <Label>Contact number</Label>
                  <Input {...form.register("guardianContact")} />
                </div>
                <div className="space-y-1">
                  <Label>Email</Label>
                  <Input type="email" {...form.register("guardianEmail")} />
                </div>
                <div className="space-y-1">
                  <Label>Preferred class</Label>
                  <Select
                    value={preferredClassValue}
                    onValueChange={(value) => {
                      setPreferredClassValue(value);
                      form.setValue("classGroupId", value);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Assign later" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Decide later</SelectItem>
                      {classes.map((classOption) => (
                        <SelectItem key={classOption.id} value={classOption.id}>
                          {classOption.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isPending}>
                  Submit registration
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <Accordion type="multiple" className="space-y-3">
        {filteredRegistrations.map((registration) => (
          <AccordionItem key={registration.id} value={registration.id} className="rounded-md border bg-white">
            <AccordionTrigger className="px-4">
              <div className="flex flex-col gap-1 text-left">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">
                    {registration.learnerData.firstName as string} {registration.learnerData.lastName as string}
                  </span>
                  <Badge className={statusTone[registration.status] ?? "bg-slate-100 text-slate-600"}>{registration.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Submitted {formatDateReadable(registration.createdAt)}
                </p>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 border-t px-4 py-4 text-sm">
              <div className="grid gap-4 md:grid-cols-2">
                <InfoBlock title="Learner details" entries={registration.learnerData} />
                <InfoBlock title="Guardian details" entries={registration.guardianData} />
              </div>
              {registration.supportingDocs && <InfoBlock title="Supporting documents" entries={registration.supportingDocs} />}
              <div className="flex flex-wrap items-center gap-3">
                <Select
                  value={selectedClasses[registration.id] ?? registration.classGroup?.id ?? ""}
                  onValueChange={(value) =>
                    setSelectedClasses((state) => ({
                      ...state,
                      [registration.id]: value,
                    }))
                  }
                >
                  <SelectTrigger className="w-56">
                    <SelectValue placeholder="Assign class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Unassigned</SelectItem>
                    {classes.map((classOption) => (
                      <SelectItem key={classOption.id} value={classOption.id}>
                        {classOption.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    mutateRegistration(registration.id, {
                      classGroupId: selectedClasses[registration.id] ?? registration.classGroup?.id ?? undefined,
                    })
                  }
                >
                  Save placement
                </Button>
              </div>
              <div className="space-y-2">
                <Label>Decision note</Label>
                <Textarea
                  value={decisionNotes[registration.id] ?? registration.decisionNote ?? ""}
                  onChange={(event) =>
                    setDecisionNotes((state) => ({
                      ...state,
                      [registration.id]: event.target.value,
                    }))
                  }
                  placeholder="Record a note for audit trail"
                />
              </div>
              <div className="flex flex-wrap gap-3">
                {registration.status === "Submitted" && (
                  <Button size="sm" onClick={() => mutateRegistration(registration.id, { status: "InReview" })}>
                    Move to review
                  </Button>
                )}
                {registration.status === "InReview" && (
                  <>
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() =>
                        mutateRegistration(registration.id, {
                          status: "Approved",
                          classGroupId: selectedClasses[registration.id] ?? registration.classGroup?.id,
                          decisionNote: decisionNotes[registration.id] ?? undefined,
                        })
                      }
                      disabled={!(selectedClasses[registration.id] ?? registration.classGroup?.id)}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() =>
                        mutateRegistration(registration.id, {
                          status: "Rejected",
                          decisionNote: decisionNotes[registration.id] ?? "",
                        })
                      }
                    >
                      Reject
                    </Button>
                  </>
                )}
                {registration.status === "Rejected" && (
                  <Button size="sm" variant="outline" onClick={() => mutateRegistration(registration.id, { status: "Submitted" })}>
                    Reopen submission
                  </Button>
                )}
                {registration.status === "Approved" && registration.student && (
                  <Badge className="bg-emerald-100 text-emerald-700">
                    Linked to student {registration.student.admissionNumber}
                  </Badge>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
        {filteredRegistrations.length === 0 && <p className="text-sm text-muted-foreground">No registrations match the current filter.</p>}
      </Accordion>
    </div>
  );
}

function InfoBlock({ title, entries }: { title: string; entries: Record<string, unknown> }) {
  const pairs = Object.entries(entries ?? {});
  if (!pairs.length) {
    return null;
  }
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs uppercase text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 text-sm">
        {pairs.map(([key, value]) => (
          <div key={key} className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">{formatKey(key)}</span>
            <span className="font-medium">{String(value ?? "—")}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function formatKey(key: string) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/^./, (char) => char.toUpperCase());
}

