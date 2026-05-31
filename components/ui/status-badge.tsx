import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Clock,
  Lock,
  AlertCircle,
  XCircle,
  FileText,
  Send,
  Wallet,
  CircleDot,
  Loader2,
  Archive,
  type LucideIcon,
} from "lucide-react";

type StatusConfig = {
  color: string;
  icon: LucideIcon;
  glow?: string;
  label?: string;
};

// All known statuses across the app — keyed by the exact string the
// backend/UI sends. Pascal-cased keys auto-format if no `label` is provided.
const statusConfig: Record<string, StatusConfig> = {
  // Workflow / moderation
  Draft: {
    color:
      "bg-[hsl(var(--status-draft))/0.2] text-[hsl(var(--text-muted-strong))] border-[hsl(var(--status-draft))/0.4]",
    icon: FileText,
    glow: "hover:shadow-[0_12px_20px_hsl(var(--status-draft)/0.4)]",
  },
  PendingApproval: {
    color:
      "bg-[hsl(var(--status-pending))/0.18] text-[hsl(var(--status-pending))] border-[hsl(var(--status-pending))/0.35]",
    icon: Clock,
    glow: "hover:shadow-[0_12px_20px_hsl(var(--status-pending)/0.35)]",
  },
  Approved: {
    color:
      "bg-[hsl(var(--status-approved))/0.18] text-[hsl(var(--status-approved))] border-[hsl(var(--status-approved))/0.35]",
    icon: CheckCircle2,
    glow: "hover:shadow-[0_12px_20px_hsl(var(--status-approved)/0.35)]",
  },
  Locked: {
    color:
      "bg-[hsl(var(--status-locked))/0.18] text-[hsl(var(--status-locked))] border-[hsl(var(--status-locked))/0.35]",
    icon: Lock,
    glow: "hover:shadow-[0_12px_20px_hsl(var(--status-locked)/0.35)]",
  },
  Rejected: {
    color:
      "bg-[hsl(var(--status-rejected))/0.18] text-[hsl(var(--status-rejected))] border-[hsl(var(--status-rejected))/0.35]",
    icon: XCircle,
    glow: "hover:shadow-[0_12px_20px_hsl(var(--status-rejected)/0.35)]",
  },
  InReview: {
    color:
      "bg-[hsl(var(--accent-cobalt))/0.18] text-[hsl(var(--accent-cobalt))] border-[hsl(var(--accent-cobalt))/0.35]",
    icon: AlertCircle,
    glow: "hover:shadow-[0_12px_20px_hsl(var(--accent-cobalt)/0.35)]",
  },
  Submitted: {
    color:
      "bg-[hsl(var(--accent-iris))/0.18] text-[hsl(var(--accent-iris))] border-[hsl(var(--accent-iris))/0.35]",
    icon: Clock,
    glow: "hover:shadow-[0_12px_20px_hsl(var(--accent-iris)/0.35)]",
  },
  Published: {
    color:
      "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    icon: CheckCircle2,
    glow: "hover:shadow-[0_12px_20px_rgba(16,185,129,0.35)]",
  },
  Finalized: {
    color:
      "bg-[hsl(var(--accent-cobalt))/0.18] text-[hsl(var(--accent-cobalt))] border-[hsl(var(--accent-cobalt))/0.35]",
    icon: Lock,
    glow: "hover:shadow-[0_12px_20px_hsl(var(--accent-cobalt)/0.35)]",
  },

  // Finance — invoices, payments
  Paid: {
    color:
      "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    icon: CheckCircle2,
  },
  PartiallyPaid: {
    color:
      "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
    icon: Wallet,
    label: "Partially Paid",
  },
  Overdue: {
    color:
      "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
    icon: AlertCircle,
  },
  Sent: {
    color:
      "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30",
    icon: Send,
  },
  Completed: {
    color:
      "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    icon: CheckCircle2,
  },
  Processing: {
    color:
      "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30",
    icon: Loader2,
  },
  Pending: {
    color:
      "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
    icon: Clock,
  },
  Failed: {
    color:
      "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
    icon: XCircle,
  },
  Cancelled: {
    color:
      "bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30",
    icon: Archive,
  },

  // Generic
  Active: {
    color:
      "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    icon: CircleDot,
  },
  Inactive: {
    color:
      "bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30",
    icon: CircleDot,
  },
};

type StatusKey = keyof typeof statusConfig;

interface StatusBadgeProps {
  status: string;
  showIcon?: boolean;
  animated?: boolean;
  className?: string;
}

function lookup(rawStatus: string): { key: StatusKey; config: StatusConfig } {
  // Accept exact match, then "Partially Paid" → "PartiallyPaid" style.
  if (rawStatus in statusConfig) {
    return { key: rawStatus as StatusKey, config: statusConfig[rawStatus] };
  }
  const compact = rawStatus.replace(/\s+/g, "");
  if (compact in statusConfig) {
    return { key: compact as StatusKey, config: statusConfig[compact] };
  }
  return { key: "Draft", config: statusConfig.Draft };
}

function defaultLabel(status: string) {
  // PascalCase → "Pascal Case", trim, leave existing spaces alone.
  if (status.includes(" ")) return status;
  return status.replace(/([A-Z])/g, " $1").trim();
}

export function StatusBadge({
  status,
  showIcon = true,
  animated = true,
  className,
}: StatusBadgeProps) {
  const { config } = lookup(status);
  const Icon = config.icon;
  const label = config.label ?? defaultLabel(status);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-all duration-200",
        config.color,
        config.glow,
        animated && "hover:scale-[1.02] hover:shadow-md",
        className,
      )}
    >
      {showIcon && <Icon aria-hidden="true" className="h-3.5 w-3.5" />}
      {label}
    </span>
  );
}
