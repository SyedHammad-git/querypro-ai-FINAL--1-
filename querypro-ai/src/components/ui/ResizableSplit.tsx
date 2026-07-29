"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface ResizableSplitProps {
  left: ReactNode;
  right: ReactNode;
  /** Initial width of the left pane, as a percentage of the container (0-100). */
  defaultSplit?: number;
  minSplit?: number;
  maxSplit?: number;
  className?: string;
  leftLabel?: string;
  rightLabel?: string;
}

/**
 * A horizontally resizable two-pane layout with a draggable divider.
 * Percentage-based (not pixel-based) so it stays correct across resizes.
 */
export function ResizableSplit({
  left,
  right,
  defaultSplit = 50,
  minSplit = 25,
  maxSplit = 75,
  className,
  leftLabel = "left pane",
  rightLabel = "right pane",
}: ResizableSplitProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [split, setSplit] = useState(defaultSplit);
  const draggingRef = useRef(false);

  const clamp = useCallback((value: number) => Math.min(maxSplit, Math.max(minSplit, value)), [minSplit, maxSplit]);

  useEffect(() => {
    function handleMove(event: PointerEvent) {
      if (!draggingRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct = ((event.clientX - rect.left) / rect.width) * 100;
      setSplit(clamp(pct));
    }
    function resetDragCursor() {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }
    function handleUp() {
      draggingRef.current = false;
      resetDragCursor();
    }
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      // If this unmounts mid-drag (e.g. the page navigates away while the
      // user is still holding the divider), pointerup never fires — without
      // this, document.body.style.cursor stays "col-resize" forever, well
      // after this component and its own listeners are gone.
      if (draggingRef.current) {
        draggingRef.current = false;
        resetDragCursor();
      }
    };
  }, [clamp]);

  function startDrag() {
    draggingRef.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowLeft") setSplit((s) => clamp(s - 2));
    if (event.key === "ArrowRight") setSplit((s) => clamp(s + 2));
    if (event.key === "Home") setSplit(minSplit);
    if (event.key === "End") setSplit(maxSplit);
  }

  return (
    <div ref={containerRef} className={cn("flex-1 flex min-h-0 min-w-0", className)}>
      <div className="min-w-0 min-h-0 flex flex-col" style={{ width: `${split}%` }} aria-label={leftLabel}>
        {left}
      </div>

      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize panels"
        aria-valuenow={Math.round(split)}
        aria-valuemin={minSplit}
        aria-valuemax={maxSplit}
        tabIndex={0}
        onPointerDown={startDrag}
        onKeyDown={handleKeyDown}
        style={{ touchAction: "none" }}
        className="group relative w-1 shrink-0 cursor-col-resize bg-transparent hover:bg-primary/40 focus-visible:bg-primary transition-colors outline-none"
      >
        <div className="absolute inset-y-0 -left-1.5 -right-1.5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-4 rounded bg-surface-container-high border border-border-subtle flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity pointer-events-none">
          <GripVertical className="h-3 w-3 text-on-surface-variant" aria-hidden="true" />
        </div>
      </div>

      <div className="min-w-0 min-h-0 flex flex-col flex-1" aria-label={rightLabel}>
        {right}
      </div>
    </div>
  );
}
