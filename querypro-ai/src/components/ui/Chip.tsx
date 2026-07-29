import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ChipTone = "success" | "error" | "neutral" | "primary" | "tertiary";

export interface ChipProps {
  children: ReactNode;
  tone?: ChipTone;
  icon?: ReactNode;
  mono?: boolean;
  className?: string;
}

const TONE_CLASSES: Record<ChipTone, string> = {
  success: "bg-success/10 text-success border-success/20",
  error: "bg-error/10 text-error border-error/20",
  neutral: "bg-surface-container-high text-on-surface-variant border-outline-variant",
  primary: "bg-primary/10 text-primary border-primary/20",
  tertiary: "bg-tertiary/10 text-tertiary border-tertiary/20",
};

/** Small status / category label. Uses JetBrains Mono for "system-generated" data per DESIGN.md. */
export function Chip({ children, tone = "neutral", icon, mono = true, className }: ChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-1 rounded-md border text-label-sm font-semibold uppercase tracking-wide",
        mono && "font-mono",
        TONE_CLASSES[tone],
        className
      )}
    >
      {icon}
      {children}
    </span>
  );
}

/** Live connection indicator pill — pulsing dot + label, used in every top bar. */
export function ConnectionBadge({ label = "PostgreSQL Connected" }: { label?: string }) {
  return (
    <div className="flex items-center gap-xs bg-surface-container-low px-md py-1.5 rounded-full border border-outline-variant">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full rounded-full bg-success animate-pulse-ring" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
      </span>
      <span className="font-mono text-label-sm text-on-surface-variant">{label}</span>
    </div>
  );
}
