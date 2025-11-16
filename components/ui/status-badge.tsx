import { cn } from "@/lib/utils";
import { CheckCircle2, Clock, Lock, AlertCircle, XCircle, FileText } from "lucide-react";

const statusConfig = {
  Draft: {
    color: "bg-slate-100 text-slate-700 border-slate-200",
    icon: FileText,
    glow: "hover:shadow-slate-200/50",
  },
  PendingApproval: {
    color: "bg-amber-100 text-amber-700 border-amber-200",
    icon: Clock,
    glow: "hover:shadow-amber-200/50",
  },
  Approved: {
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: CheckCircle2,
    glow: "hover:shadow-emerald-200/50",
  },
  Locked: {
    color: "bg-blue-100 text-blue-700 border-blue-200",
    icon: Lock,
    glow: "hover:shadow-blue-200/50",
  },
  Rejected: {
    color: "bg-rose-100 text-rose-700 border-rose-200",
    icon: XCircle,
    glow: "hover:shadow-rose-200/50",
  },
  InReview: {
    color: "bg-purple-100 text-purple-700 border-purple-200",
    icon: AlertCircle,
    glow: "hover:shadow-purple-200/50",
  },
  Submitted: {
    color: "bg-cyan-100 text-cyan-700 border-cyan-200",
    icon: Clock,
    glow: "hover:shadow-cyan-200/50",
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

