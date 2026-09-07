"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/ui/status-badge";
import { useRoleStore } from "@/lib/stores/role-store";
import { formatDateReadable } from "@/lib/date-utils";
import { FileText, Upload, CheckCircle, AlertCircle, Clock } from "lucide-react";

// South African standard document requirements
const DOCUMENT_REQUIREMENTS = [
  { id: "birth_certificate", name: "Birth Certificate", required: true, description: "Certified copy of the learner's birth certificate" },
  { id: "parent_id", name: "Parent/Guardian ID", required: true, description: "Copy of parent or guardian's South African ID" },
  { id: "proof_of_residence", name: "Proof of Residence", required: true, description: "Recent utility bill or affidavit (not older than 3 months)" },
  { id: "immunization", name: "Immunization Card", required: true, description: "Road to Health card or immunization records" },
  { id: "transfer_card", name: "Transfer Card", required: false, description: "Required for learners transferring from another school" },
  { id: "previous_report", name: "Previous School Report", required: false, description: "Most recent report card from previous school" },
  { id: "medical_certificate", name: "Medical Certificate", required: false, description: "For learners with special medical needs" },
  { id: "passport_photo", name: "Passport Photo", required: true, description: "Recent passport-sized photograph of the learner" },
];

const statusFilters = ["All", "Submitted", "InReview", "Approved", "Rejected"] as const;

const UNASSIGNED_VALUE = "__UNASSIGNED__";

const GENDER_UNSPECIFIED = "__GENDER_UNSPECIFIED__";
const GENDER_CUSTOM = "__GENDER_CUSTOM__";
const genderOptions = [
  { value: "Female", label: "Female" },
  { value: "Male", label: "Male" },
  { value: "Non-binary", label: "Non-binary" },
  { value: "Prefer not to say", label: "Prefer not to say" },
];

function toSelectValue(value?: string | null) {
  if (!value) return UNASSIGNED_VALUE;
  return value;
}

function fromSelectValue(value: string) {
  return value === UNASSIGNED_VALUE ? undefined : value;
}

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
  const [preferredClassValue, setPreferredClassValue] = useState(() => toSelectValue(form.getValues("classGroupId")));
  const initialGender = form.getValues("gender") ?? "";
  const initialGenderOption = initialGender
    ? genderOptions.some((option) => option.value === initialGender)
      ? initialGender
      : GENDER_CUSTOM
    : GENDER_UNSPECIFIED;
  const [genderOption, setGenderOption] = useState(initialGenderOption);
  const [customGenderValue, setCustomGenderValue] = useState(
    initialGenderOption === GENDER_CUSTOM ? initialGender : "",
  );

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
      setGenderOption(GENDER_UNSPECIFIED);
      setCustomGenderValue("");
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
                  <Select
                    value={genderOption}
                    onValueChange={(value) => {
                      setGenderOption(value);
                      if (value === GENDER_UNSPECIFIED) {
                        form.setValue("gender", "");
                        return;
                      }
                      if (value === GENDER_CUSTOM) {
                        form.setValue("gender", customGenderValue);
                        return;
                      }
                      form.setValue("gender", value);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={GENDER_UNSPECIFIED}>Select gender</SelectItem>
                      {genderOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                      <SelectItem value={GENDER_CUSTOM}>Custom value</SelectItem>
                    </SelectContent>
                  </Select>
                  {genderOption === GENDER_CUSTOM && (
                    <Input
                      className="mt-2"
                      placeholder="Describe gender"
                      value={customGenderValue}
                      onChange={(event) => {
                        const value = event.target.value;
                        setCustomGenderValue(value);
                        form.setValue("gender", value);
                      }}
                    />
                  )}
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
                      form.setValue("classGroupId", fromSelectValue(value));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Assign later" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={UNASSIGNED_VALUE}>Decide later</SelectItem>
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
          <AccordionItem
            key={registration.id}
            value={registration.id}
            className="rounded-md border border-[hsl(var(--border))/0.5] bg-[hsl(var(--surface-strong))] shadow-ambient-sm"
          >
            <AccordionTrigger className="px-4">
              <div className="flex flex-col gap-1 text-left">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">
                    {registration.learnerData.firstName as string} {registration.learnerData.lastName as string}
                  </span>
                  <StatusBadge status={registration.status} />
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
              {/* Document Requirements Checklist */}
              <DocumentChecklist 
                supportingDocs={registration.supportingDocs}
                registrationId={registration.id}
                status={registration.status}
                onUpdate={(docs) => mutateRegistration(registration.id, { supportingDocs: docs })}
              />
              <div className="flex flex-wrap items-center gap-3">
                <Select
                  value={toSelectValue(selectedClasses[registration.id] ?? registration.classGroup?.id)}
                  onValueChange={(value) =>
                    setSelectedClasses((state) => ({
                      ...state,
                      [registration.id]: fromSelectValue(value) ?? "",
                    }))
                  }
                >
                  <SelectTrigger className="w-56">
                    <SelectValue placeholder="Assign class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UNASSIGNED_VALUE}>Unassigned</SelectItem>
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
                  onClick={() => {
                    const pendingClass = selectedClasses[registration.id] ?? registration.classGroup?.id ?? "";
                    mutateRegistration(registration.id, {
                      classGroupId: pendingClass || undefined,
                    });
                  }}
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
                      onClick={() => {
                        const pendingClass = selectedClasses[registration.id] ?? registration.classGroup?.id ?? "";
                        mutateRegistration(registration.id, {
                          status: "Approved",
                          classGroupId: pendingClass || undefined,
                          decisionNote: decisionNotes[registration.id] ?? undefined,
                        });
                      }}
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
                  <Badge className="bg-[hsl(var(--success))/0.15] text-[hsl(var(--success))]">
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

// Document Checklist Component for registration
interface DocumentChecklistProps {
  supportingDocs: Record<string, unknown> | null;
  registrationId: string;
  status: string;
  onUpdate: (docs: Record<string, unknown>) => void;
}

function DocumentChecklist({ supportingDocs, registrationId, status, onUpdate }: DocumentChecklistProps) {
  const docs = supportingDocs || {};
  
  // Calculate completion percentage
  const requiredDocs = DOCUMENT_REQUIREMENTS.filter(d => d.required);
  const submittedRequired = requiredDocs.filter(d => docs[d.id]?.toString().startsWith("submitted") || docs[d.id]?.toString().startsWith("verified"));
  const completionPercent = Math.round((submittedRequired.length / requiredDocs.length) * 100);
  
  const getDocStatus = (docId: string): "missing" | "submitted" | "verified" => {
    const value = docs[docId];
    if (!value) return "missing";
    if (value.toString().startsWith("verified")) return "verified";
    return "submitted";
  };

  const updateDocStatus = (docId: string, newStatus: string) => {
    const updatedDocs = { ...docs, [docId]: newStatus };
    onUpdate(updatedDocs);
  };

  return (
    <Card className="border-amber-200/50 bg-amber-50/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4 text-amber-600" />
              Document Requirements
            </CardTitle>
            <CardDescription className="text-xs">
              Standard South African school registration documents
            </CardDescription>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-amber-700">{completionPercent}%</p>
            <p className="text-xs text-muted-foreground">Complete</p>
          </div>
        </div>
        <Progress value={completionPercent} className="h-2 mt-2" />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-2 sm:grid-cols-2">
          {DOCUMENT_REQUIREMENTS.map((doc) => {
            const docStatus = getDocStatus(doc.id);
            return (
              <div
                key={doc.id}
                className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                  docStatus === "verified"
                    ? "bg-emerald-50 border-emerald-200"
                    : docStatus === "submitted"
                    ? "bg-blue-50 border-blue-200"
                    : doc.required
                    ? "bg-red-50/50 border-red-200/50"
                    : "bg-card border-border"
                }`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {docStatus === "verified" ? (
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                  ) : docStatus === "submitted" ? (
                    <Clock className="h-5 w-5 text-blue-600" />
                  ) : doc.required ? (
                    <AlertCircle className="h-5 w-5 text-red-400" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-border" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{doc.name}</p>
                    {doc.required && (
                      <Badge variant="outline" className="text-[10px] px-1 py-0">
                        Required
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{doc.description}</p>
                  
                  {/* Action buttons based on status and role */}
                  {status !== "Approved" && status !== "Rejected" && (
                    <div className="flex gap-2 mt-2">
                      {docStatus === "missing" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => updateDocStatus(doc.id, `submitted_${new Date().toISOString()}`)}
                        >
                          <Upload className="h-3 w-3 mr-1" />
                          Mark Submitted
                        </Button>
                      )}
                      {docStatus === "submitted" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs bg-emerald-50 hover:bg-emerald-100 border-emerald-300"
                            onClick={() => updateDocStatus(doc.id, `verified_${new Date().toISOString()}`)}
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Verify
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs text-red-600"
                            onClick={() => updateDocStatus(doc.id, "")}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      {docStatus === "verified" && (
                        <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                          Verified
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Summary */}
        <div className="flex items-center justify-between pt-3 border-t text-xs text-muted-foreground">
          <span>
            {submittedRequired.length} of {requiredDocs.length} required documents submitted
          </span>
          {completionPercent === 100 && (
            <Badge className="bg-emerald-100 text-emerald-700">
              All Required Documents Complete
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

