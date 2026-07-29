import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Required — icon-only controls must always have an accessible name. */
  "aria-label": string;
  active?: boolean;
  tone?: "default" | "inverse";
}

/**
 * Icon-only control. `aria-label` is required at the type level so every
 * icon button in the app stays keyboard- and screen-reader-accessible.
 */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, active, tone = "default", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          "inline-flex items-center justify-center h-9 w-9 rounded-full transition-colors duration-200 active:scale-95",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
          tone === "default" && [
            "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface",
            active && "bg-primary/10 text-primary",
          ],
          tone === "inverse" && [
            "text-white/60 hover:bg-white/10 hover:text-white",
            active && "bg-white/10 text-white",
          ],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
IconButton.displayName = "IconButton";
