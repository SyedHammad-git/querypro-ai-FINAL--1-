"use client";

import { Bookmark, Download, Play, Redo2, Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface BuilderToolbarProps {
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onRun: () => void;
  onExport: () => void;
  onSave: () => void;
  saved: boolean;
  running: boolean;
  hasErrors: boolean;
}

export function BuilderToolbar({
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onRun,
  onExport,
  onSave,
  saved,
  running,
  hasErrors,
}: BuilderToolbarProps) {
  return (
    <div className="flex items-center gap-sm p-md border-b border-border-subtle bg-surface-container-lowest flex-wrap">
      <button
        type="button"
        onClick={onUndo}
        disabled={!canUndo}
        aria-label="Undo"
        className="p-2 rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container-low disabled:opacity-40 disabled:pointer-events-none transition-colors"
      >
        <Undo2 className="h-[13.5px] w-[13.5px]" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={onRedo}
        disabled={!canRedo}
        aria-label="Redo"
        className="p-2 rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container-low disabled:opacity-40 disabled:pointer-events-none transition-colors"
      >
        <Redo2 className="h-[13.5px] w-[13.5px]" aria-hidden="true" />
      </button>

      <div className="w-px h-6 bg-border-subtle mx-1" />

      <button
        type="button"
        onClick={onSave}
        aria-pressed={saved}
        className={cn(
          "flex items-center gap-xs px-md py-2 rounded-lg font-label-md border transition-colors",
          saved
            ? "bg-primary/10 text-primary border-primary/30"
            : "border-outline-variant text-on-surface-variant hover:bg-surface-container-low"
        )}
      >
        <Bookmark className={cn("h-4 w-4", saved && "fill-current")} aria-hidden="true" />
        {saved ? "Saved" : "Save"}
      </button>
      <button
        type="button"
        onClick={onExport}
        className="flex items-center gap-xs px-md py-2 rounded-lg font-label-md border border-outline-variant text-on-surface-variant hover:bg-surface-container-low transition-colors"
      >
        <Download className="h-4 w-4" aria-hidden="true" />
        Export
      </button>

      <div className="flex-1" />

      <button
        type="button"
        onClick={onRun}
        disabled={running || hasErrors}
        title={hasErrors ? "Resolve validation errors before running" : undefined}
        className="flex items-center gap-xs px-lg py-2 rounded-lg font-label-md font-semibold bg-primary text-on-primary shadow-lg shadow-primary/20 hover:brightness-110 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none disabled:scale-100"
      >
        <Play className="h-4 w-4" aria-hidden="true" />
        {running ? "Running…" : "Run Query"}
      </button>
    </div>
  );
}
