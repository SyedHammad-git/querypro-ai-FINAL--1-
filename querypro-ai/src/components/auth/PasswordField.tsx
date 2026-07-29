"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  placeholder?: string;
  rightSlot?: ReactNode;
  /** Shows a lightweight strength meter below the field — used on Create Account. */
  showStrength?: boolean;
}

type Strength = "weak" | "fair" | "strong";

function estimateStrength(value: string): Strength {
  const variety =
    Number(/[a-z]/.test(value)) +
    Number(/[A-Z]/.test(value)) +
    Number(/[0-9]/.test(value)) +
    Number(/[^A-Za-z0-9]/.test(value));
  if (value.length >= 10 && variety >= 3) return "strong";
  if (value.length >= 6 && variety >= 2) return "fair";
  return "weak";
}

const STRENGTH_META: Record<Strength, { label: string; className: string; width: string }> = {
  weak: { label: "Weak", className: "bg-error", width: "w-1/3" },
  fair: { label: "Fair", className: "bg-tertiary", width: "w-2/3" },
  strong: { label: "Strong", className: "bg-success", width: "w-full" },
};

/** Shared password input for the auth pages: mask toggle, optional forgot-password slot, optional strength meter. */
export function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  placeholder = "••••••••••",
  rightSlot,
  showStrength = false,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const strength = estimateStrength(value);
  const meta = STRENGTH_META[strength];

  return (
    <div className="flex flex-col gap-xs">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="font-label-md font-semibold text-on-surface">
          {label}
        </label>
        {rightSlot ?? (showStrength && value.length > 0 ? (
          <span className={cn("text-label-sm font-semibold", meta.className.replace("bg-", "text-"))}>
            {meta.label}
          </span>
        ) : null)}
      </div>
      <div className="relative">
        <Lock
          className="absolute left-md top-1/2 -translate-y-1/2 h-[13.5px] w-[13.5px] text-on-surface-variant pointer-events-none"
          aria-hidden="true"
        />
        <input
          id={id}
          type={visible ? "text" : "password"}
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className="w-full border border-outline-variant rounded-lg pl-[33px] pr-[33px] py-md text-body-md bg-surface-container-lowest focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute right-md top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
        >
          {visible ? (
            <EyeOff className="h-[13.5px] w-[13.5px]" aria-hidden="true" />
          ) : (
            <Eye className="h-[13.5px] w-[13.5px]" aria-hidden="true" />
          )}
        </button>
      </div>
      {showStrength && value.length > 0 && (
        <div className="h-1 rounded-full bg-surface-container-high overflow-hidden">
          <div className={cn("h-full rounded-full transition-all duration-300", meta.className, meta.width)} />
        </div>
      )}
    </div>
  );
}
