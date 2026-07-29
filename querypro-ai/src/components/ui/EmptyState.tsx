import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center text-center gap-md py-2xl px-lg", className)}>
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
        <Icon className="h-7 w-7 text-primary" aria-hidden="true" />
      </div>
      <div className="max-w-sm">
        <h3 className="font-heading text-headline-sm text-on-surface">{title}</h3>
        <p className="font-sans text-body-md text-on-surface-variant mt-1">{description}</p>
      </div>
      {action}
    </div>
  );
}
