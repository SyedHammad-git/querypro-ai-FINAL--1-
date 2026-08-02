"use client";

import { cn } from "@/lib/utils";

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  /** Hides the visible text label, keeping it for screen readers only — for compact toggle chips that already show the label separately. */
  labelHidden?: boolean;
}

/** Shared on/off switch control — the same visual used across Settings and the builder forms. */
export function Switch({ checked, onChange, label, labelHidden = false }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={labelHidden ? label : undefined}
      onClick={() => onChange(!checked)}
      className={cn(
        "shrink-0 relative inline-flex items-center w-11 h-6 rounded-full transition-colors duration-200",
        checked ? "bg-primary" : "bg-surface-variant"
      )}
    >
      <span
        className={cn(
          "absolute top-1/2 left-0.5 -translate-y-1/2 h-5 w-5 rounded-full bg-white shadow-elevation-1 transition-transform duration-200",
          checked ? "translate-x-[22px]" : "translate-x-0"
        )}
      />
    </button>
  );
}
