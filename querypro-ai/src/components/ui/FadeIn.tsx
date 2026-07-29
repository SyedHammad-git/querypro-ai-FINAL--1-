import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Wraps content that should fade+slide in once it's ready to render (post-skeleton, post-navigation). */
export function FadeIn({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("animate-fade-in", className)}>{children}</div>;
}
