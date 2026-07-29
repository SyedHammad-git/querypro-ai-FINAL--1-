import type { LucideIcon } from "lucide-react";
import { X } from "lucide-react";

interface InfoPanelProps {
  icon: LucideIcon;
  title: string;
  content: string;
  tone: "ai" | "tertiary";
  onDismiss: () => void;
}

const TONE_CLASSES: Record<InfoPanelProps["tone"], { bg: string; icon: string; border: string }> = {
  ai: { bg: "bg-accent-ai/5", icon: "text-accent-ai", border: "border-accent-ai/20" },
  tertiary: { bg: "bg-tertiary/5", icon: "text-tertiary", border: "border-tertiary/20" },
};

export function InfoPanel({ icon: Icon, title, content, tone, onDismiss }: InfoPanelProps) {
  const classes = TONE_CLASSES[tone];
  return (
    <div className={`p-md rounded-lg border ${classes.bg} ${classes.border} flex items-start gap-sm`}>
      <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${classes.icon}`} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <div className="font-label-md font-semibold text-on-surface mb-0.5">{title}</div>
        <p className="text-body-md text-on-surface-variant leading-relaxed">{content}</p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label={`Dismiss ${title.toLowerCase()}`}
        className="text-on-surface-variant hover:text-on-surface shrink-0"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
