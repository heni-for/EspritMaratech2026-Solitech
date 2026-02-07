import { CheckCircle2, XCircle, MinusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type StatusIndicatorProps = {
  status: "present" | "absent" | "not_marked";
  className?: string;
  display?: "text" | "color";
};

const STATUS_COPY = {
  present: {
    label: "Present",
    color: "text-green-600 dark:text-green-400",
    Icon: CheckCircle2,
  },
  absent: {
    label: "Absent",
    color: "text-red-600 dark:text-red-400",
    Icon: XCircle,
  },
  not_marked: {
    label: "Non marque",
    color: "text-muted-foreground",
    Icon: MinusCircle,
  },
} as const;

export function StatusIndicator({ status, className, display }: StatusIndicatorProps) {
  const { label, color, Icon } = STATUS_COPY[status];
  const resolvedDisplay =
    display ||
    (typeof document !== "undefined"
      ? (document.documentElement.getAttribute("data-status-display") as
          | "text"
          | "color"
          | null)
      : null) ||
    "color";
  const showColor = resolvedDisplay === "color";
  const showText = resolvedDisplay === "text";
  const toneClass = showColor ? color : "text-foreground";

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <Icon className={cn("h-4 w-4", status === "not_marked" ? color : toneClass)} aria-hidden="true" />
      {showText ? (
        <span className={cn("text-xs font-medium", status === "not_marked" ? color : toneClass)}>{label}</span>
      ) : (
        <span className="sr-only">{label}</span>
      )}
    </span>
  );
}
