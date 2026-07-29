"use client";

import { forwardRef, useState } from "react";
import type { ButtonHTMLAttributes, MouseEvent } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-on-primary shadow-elevation-1 hover:brightness-110 hover:shadow-elevation-2",
  secondary:
    "bg-transparent border border-primary text-primary hover:bg-primary/5",
  ghost: "bg-transparent text-on-surface-variant hover:bg-surface-container-low",
  danger: "bg-error text-on-error hover:brightness-110",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "h-8 px-sm text-label-md rounded",
  md: "h-10 px-md text-label-md rounded-lg",
  lg: "h-12 px-lg text-body-lg font-semibold rounded-lg",
  icon: "h-10 w-10 rounded-lg",
};

interface Ripple {
  id: number;
  x: number;
  y: number;
  size: number;
}

let rippleCounter = 0;

/**
 * Primary interactive control. Solid Logic Blue for primary actions,
 * outlined for secondary, and borderless for low-emphasis "ghost" actions —
 * per DESIGN.md's Buttons spec, including the 98% tactile press effect and
 * a subtle click ripple for tactile feedback.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, onClick, ...props }, ref) => {
    const [ripples, setRipples] = useState<Ripple[]>([]);

    function handleClick(event: MouseEvent<HTMLButtonElement>) {
      const target = event.currentTarget;
      const rect = target.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 1.6;
      const id = rippleCounter++;
      const ripple: Ripple = {
        id,
        x: event.clientX - rect.left - size / 2,
        y: event.clientY - rect.top - size / 2,
        size,
      };
      setRipples((prev) => [...prev, ripple]);
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id));
      }, 600);
      onClick?.(event);
    }

    return (
      <button
        ref={ref}
        onClick={handleClick}
        className={cn(
          "relative overflow-hidden inline-flex items-center justify-center gap-2 font-label-md whitespace-nowrap",
          "transition-all duration-200 active:scale-[0.98]",
          "disabled:opacity-50 disabled:pointer-events-none",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1",
          VARIANT_CLASSES[variant],
          SIZE_CLASSES[size],
          className
        )}
        {...props}
      >
        {children}
        {ripples.map((ripple) => (
          <span
            key={ripple.id}
            aria-hidden="true"
            className="absolute rounded-full bg-white/30 pointer-events-none animate-ripple"
            style={{
              left: ripple.x,
              top: ripple.y,
              width: ripple.size,
              height: ripple.size,
            }}
          />
        ))}
      </button>
    );
  }
);
Button.displayName = "Button";
