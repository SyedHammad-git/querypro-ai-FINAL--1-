"use client";

import type { ReactNode } from "react";
import { useSimulatedLoad } from "@/lib/use-simulated-load";
import { FadeIn } from "./FadeIn";

interface LoadingRevealProps {
  skeleton: ReactNode;
  children: ReactNode;
  delayMs?: number;
  /** Passed through to the FadeIn wrapper — use "flex-1 min-h-0 flex flex-col" for full-bleed (scrollableMain=false) pages so content actually fills the screen instead of sizing to its own content. */
  className?: string;
}

/**
 * Drop-in loading transition: renders `skeleton` briefly, then fades in
 * `children`. Being its own small client component means server-component
 * pages (which keep their `metadata` export) can still get a real loading
 * state without converting the whole page to a client component.
 */
export function LoadingReveal({ skeleton, children, delayMs, className }: LoadingRevealProps) {
  const loading = useSimulatedLoad(delayMs);
  if (loading) return <>{skeleton}</>;
  return <FadeIn className={className}>{children}</FadeIn>;
}
