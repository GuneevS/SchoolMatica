"use client";

import * as React from "react";
import { useId, useState } from "react";
import { Loader2, AlertTriangle } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export interface ConfirmDialogProps {
  /** Controlled open state. */
  open: boolean;
  /** Open-change callback (fires for both open and close transitions). */
  onOpenChange: (open: boolean) => void;
  /** Dialog title — required for screen reader users. */
  title: React.ReactNode;
  /** Body copy explaining the action and its consequences. */
  description?: React.ReactNode;
  /** Confirm button label (defaults to "Confirm"). */
  confirmLabel?: string;
  /** Cancel button label (defaults to "Cancel"). */
  cancelLabel?: string;
  /** Variant of the confirm button — "destructive" by default for destructive actions. */
  confirmVariant?: "default" | "destructive";
  /**
   * Optional typed-confirmation guard. If provided, the user must type this
   * exact string before the confirm button is enabled. Use for irreversible
   * actions like deleting a student.
   */
  typedConfirmation?: {
    /** The exact text the user must type. */
    expected: string;
    /** Label shown above the input ("Type the student's name to confirm"). */
    label: React.ReactNode;
    /** Placeholder text inside the input. */
    placeholder?: string;
  };
  /** Called when the user confirms. May be async — UI shows a loader. */
  onConfirm: () => void | Promise<void>;
  /**
   * If true, the dialog closes itself after a successful onConfirm. If false,
   * the caller is responsible for closing (useful when onConfirm sets state
   * that closes the dialog as a side effect). Default: true.
   */
  autoClose?: boolean;
  /** Optional children rendered above the footer (e.g., custom warnings). */
  children?: React.ReactNode;
}

/**
 * High-level confirmation dialog for destructive or important actions.
 * Built on the Radix AlertDialog primitive — full focus trap, ESC support,
 * `aria-modal`, return-focus.
 *
 * Use this instead of `window.confirm()` for any user-visible confirmation.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmVariant = "destructive",
  typedConfirmation,
  onConfirm,
  autoClose = true,
  children,
}: ConfirmDialogProps) {
  const [isPending, setIsPending] = useState(false);
  const [typed, setTyped] = useState("");
  const typedInputId = useId();

  // Reset typed state whenever the dialog opens.
  React.useEffect(() => {
    if (open) setTyped("");
  }, [open]);

  const typedMatches =
    !typedConfirmation || typed.trim() === typedConfirmation.expected.trim();

  const handleAction = async (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!typedMatches || isPending) {
      event.preventDefault();
      return;
    }
    // Always prevent Radix's default auto-close so we can manage it ourselves
    // (it fires before the async work resolves, which can hide failures).
    event.preventDefault();
    setIsPending(true);
    try {
      await onConfirm();
      if (autoClose) onOpenChange(false);
    } finally {
      setIsPending(false);
    }
  };

  const isDestructive = confirmVariant === "destructive";

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        // Don't allow closing while the action is in flight.
        if (isPending && !next) return;
        onOpenChange(next);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-start gap-3">
            {isDestructive && (
              <div
                aria-hidden="true"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive/12 text-destructive"
              >
                <AlertTriangle className="h-5 w-5" />
              </div>
            )}
            <div className="flex-1 space-y-2">
              <AlertDialogTitle>{title}</AlertDialogTitle>
              {description && (
                <AlertDialogDescription>{description}</AlertDialogDescription>
              )}
            </div>
          </div>
        </AlertDialogHeader>

        {children}

        {typedConfirmation && (
          <div className="space-y-2">
            <Label htmlFor={typedInputId}>{typedConfirmation.label}</Label>
            <Input
              id={typedInputId}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={typedConfirmation.placeholder ?? typedConfirmation.expected}
              autoComplete="off"
              spellCheck={false}
              disabled={isPending}
              aria-describedby={`${typedInputId}-hint`}
            />
            <p id={`${typedInputId}-hint`} className="text-xs text-muted-foreground">
              Type <span className="font-mono font-semibold">{typedConfirmation.expected}</span> to confirm.
            </p>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleAction}
            disabled={!typedMatches || isPending}
            className={cn(
              isDestructive && buttonVariants({ variant: "destructive" }),
            )}
          >
            {isPending ? (
              <>
                <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                Working…
              </>
            ) : (
              confirmLabel
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
