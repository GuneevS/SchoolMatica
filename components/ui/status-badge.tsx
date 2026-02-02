import { cn } from "@/lib/utils";
import { CheckCircle2, Clock, Lock, AlertCircle, XCircle, FileText } from "lucide-react";

const statusConfig = {
  Draft: {
    color: "bg-[hsl(var(--status-draft))/0.2] text-[hsl(var(--text-muted-strong))] border-[hsl(var(--status-draft))/0.4]",
    icon: FileText,
    glow: "hover:shadow-[0_12px_20px_hsl(var(--status-draft)/0.4)]",
  },
  PendingApproval: {
    color: "bg-[hsl(var(--status-pending))/0.18] text-[hsl(var(--status-pending))] border-[hsl(var(--status-pending))/0.35]",
    icon: Clock,
    glow: "hover:shadow-[0_12px_20px_hsl(var(--status-pending)/0.35)]",
  },
  Approved: {
    color: "bg-[hsl(var(--status-approved))/0.18] text-[hsl(var(--status-approved))] border-[hsl(var(--status-approved))/0.35]",
    icon: CheckCircle2,
    glow: "hover:shadow-[0_12px_20px_hsl(var(--status-approved)/0.35)]",
  },
  Locked: {
    color: "bg-[hsl(var(--status-locked))/0.18] text-[hsl(var(--status-locked))] border-[hsl(var(--status-locked))/0.35]",
    icon: Lock,
    glow: "hover:shadow-[0_12px_20px_hsl(var(--status-locked)/0.35)]",
  },
  Rejected: {
    color: "bg-[hsl(var(--status-rejected))/0.18] text-[hsl(var(--status-rejected))] border-[hsl(var(--status-rejected))/0.35]",
    icon: XCircle,
    glow: "hover:shadow-[0_12px_20px_hsl(var(--status-rejected)/0.35)]",
  },
  InReview: {
    color: "bg-[hsl(var(--accent-cobalt))/0.18] text-[hsl(var(--accent-cobalt))] border-[hsl(var(--accent-cobalt))/0.35]",
    icon: AlertCircle,
    glow: "hover:shadow-[0_12px_20px_hsl(var(--accent-cobalt)/0.35)]",
  },
  Submitted: {
    color: "bg-[hsl(var(--accent-iris))/0.18] text-[hsl(var(--accent-iris))] border-[hsl(var(--accent-iris))/0.35]",
    icon: Clock,
    glow: "hover:shadow-[0_12px_20px_hsl(var(--accent-iris)/0.35)]",
  },
  Published: {
    color: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
    icon: CheckCircle2,
    glow: "hover:shadow-[0_12px_20px_rgba(16,185,129,0.35)]",
  },
  Finalized: {
    color: "bg-[hsl(var(--accent-cobalt))/0.18] text-[hsl(var(--accent-cobalt))] border-[hsl(var(--accent-cobalt))/0.35]",
    icon: Lock,
    glow: "hover:shadow-[0_12px_20px_hsl(var(--accent-cobalt)/0.35)]",
  },
};

type Status = keyof typeof statusConfig;

interface StatusBadgeProps {
  status: string;
  showIcon?: boolean;
  animated?: boolean;
  className?: string;
}

export function StatusBadge({ status, showIcon = true, animated = true, className }: StatusBadgeProps) {
  const config = statusConfig[status as Status] || statusConfig.Draft;
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all duration-200",
        config.color,
        config.glow,
        animated && "hover:scale-105 hover:shadow-lg",
        className,
      )}
    >
      {showIcon && <Icon className="h-3.5 w-3.5" />}
      {status.replace(/([A-Z])/g, " $1").trim()}
    </span>
  );
}

