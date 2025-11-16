"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { AssessmentDocument, DocumentApproval } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useRoleStore } from "@/lib/stores/role-store";

const STATUS_OPTIONS = ["Draft", "Pending", "Approved", "ChangesRequested"] as const;

interface DocumentWithApprovals extends AssessmentDocument {
  approvals: DocumentApproval[];
}

interface Props {
  planId: string;
  documents: DocumentWithApprovals[];
}

export function PlanDocuments({ planId, documents }: Props) {
  const role = useRoleStore((state) => state.role);
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reviewerName, setReviewerName] = useState("");
  const [formState, setFormState] = useState({
    label: "",
    fileName: "",
    fileUrl: "",
    mimeType: "application/pdf",
    status: "Pending" as (typeof STATUS_OPTIONS)[number],
    uploadedByName: "",
  });
  const [isPending, startTransition] = useTransition();

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setFormState((state) => ({ ...state, [name]: value }));
  }

  function createDocument() {
    if (!formState.label || !formState.fileUrl || !formState.fileName) {
      return;
    }
    startTransition(async () => {
      await fetch("/api/assessment-documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessmentPlanId: planId,
          label: formState.label,
          fileName: formState.fileName,
          mimeType: formState.mimeType || "application/pdf",
          fileUrl: formState.fileUrl,
          storageKey: formState.fileUrl,
          status: formState.status,
          uploadedByRole: role,
          uploadedByName: formState.uploadedByName || undefined,
        }),
      });
      setDialogOpen(false);
      setFormState({
        label: "",
        fileName: "",
        fileUrl: "",
        mimeType: "application/pdf",
        status: "Pending",
        uploadedByName: "",
      });
      router.refresh();
    });
  }

  function updateStatus(documentId: string, status: (typeof STATUS_OPTIONS)[number]) {
    startTransition(async () => {
      await fetch(`/api/assessment-documents/${documentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      router.refresh();
    });
  }

  function recordDecision(documentId: string, status: "Approved" | "ChangesRequested") {
    startTransition(async () => {
      await fetch(`/api/assessment-documents/${documentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          approval: {
            reviewerRole: role,
            reviewerName: reviewerName || undefined,
            status,
          },
        }),
      });
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 space-y-0 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Moderation documents</CardTitle>
        <div className="flex flex-1 flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end">
          <Input
            placeholder="Reviewer name"
            value={reviewerName}
            onChange={(event) => setReviewerName(event.target.value)}
            className="sm:max-w-[200px]"
          />
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">Add document</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload document metadata</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="doc-label">Label</Label>
                <Input id="doc-label" name="label" value={formState.label} onChange={handleChange} placeholder="e.g. PAT rubric" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="doc-fileName">File name</Label>
                <Input id="doc-fileName" name="fileName" value={formState.fileName} onChange={handleChange} placeholder="rubric.pdf" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="doc-url">File URL</Label>
                <Input id="doc-url" name="fileUrl" value={formState.fileUrl} onChange={handleChange} placeholder="https://..." />
              </div>
              <div className="space-y-1">
                <Label htmlFor="doc-mime">MIME type</Label>
                <Input id="doc-mime" name="mimeType" value={formState.mimeType} onChange={handleChange} placeholder="application/pdf" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="doc-uploadedByName">Uploaded by (name)</Label>
                <Input
                  id="doc-uploadedByName"
                  name="uploadedByName"
                  value={formState.uploadedByName}
                  onChange={handleChange}
                  placeholder="Optional"
                />
              </div>
              <div className="space-y-1">
                <Label>Status</Label>
                <Select value={formState.status} onValueChange={(value) => setFormState((state) => ({ ...state, status: value as (typeof STATUS_OPTIONS)[number] }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={createDocument} disabled={isPending || !formState.label || !formState.fileUrl || !formState.fileName}>
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {documents.length === 0 && <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>}
        {documents.map((document) => (
          <div key={document.id} className="rounded-md border p-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="font-semibold">{document.label}</p>
                <p className="text-xs text-muted-foreground">{document.fileName}</p>
              </div>
              <Badge variant="outline">{document.status}</Badge>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button asChild variant="ghost" size="sm">
                <a href={document.fileUrl} target="_blank" rel="noreferrer">
                  View file
                </a>
              </Button>
              <Select defaultValue={document.status} onValueChange={(value) => updateStatus(document.id, value as (typeof STATUS_OPTIONS)[number])}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={() => recordDecision(document.id, "Approved")}>
                Approve
              </Button>
              <Button variant="destructive" size="sm" onClick={() => recordDecision(document.id, "ChangesRequested")}>
                Request changes
              </Button>
            </div>
            {document.approvals.length > 0 && (
              <div className="mt-3 space-y-1 rounded-md bg-muted/50 p-2">
                {document.approvals.map((approval) => (
                  <p key={approval.id} className="text-xs text-muted-foreground">
                    {approval.reviewerRole} · {approval.status}
                    {approval.reviewerName ? ` · ${approval.reviewerName}` : ""}
                  </p>
                ))}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
