"use client";

import { Clock3, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface GeneratorHistoryEntry {
  id: string;
  prompt: string;
  timestamp: string;
}

interface GeneratorHistoryDrawerProps {
  open: boolean;
  onClose: () => void;
  entries: GeneratorHistoryEntry[];
  activeId: string | null;
  onSelect: (id: string) => void;
}

export function GeneratorHistoryDrawer({
  open,
  onClose,
  entries,
  activeId,
  onSelect,
}: GeneratorHistoryDrawerProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label="Generation history">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-backdrop-in" onClick={onClose} aria-hidden="true" />
      <aside className="absolute right-0 top-0 h-full w-full max-w-sm bg-surface-container-lowest border-l border-outline-variant shadow-elevation-3 flex flex-col animate-drawer-in-right">
        <div className="h-14 shrink-0 flex items-center justify-between px-lg border-b border-border-subtle">
          <h2 className="font-heading text-headline-sm text-on-surface">This session</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close history"
            className="p-1.5 rounded hover:bg-surface-container-low text-on-surface-variant"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin p-md">
          {entries.length === 0 ? (
            <p className="text-body-md text-on-surface-variant text-center py-lg">
              Nothing generated yet this session.
            </p>
          ) : (
            <div className="flex flex-col gap-1">
              {entries.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => onSelect(entry.id)}
                  className={cn(
                    "flex items-start gap-sm text-left p-sm rounded-lg transition-colors",
                    activeId === entry.id
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-surface-container-low text-on-surface-variant"
                  )}
                >
                  <Clock3 className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
                  <div className="min-w-0">
                    <div className="font-label-md truncate">{entry.prompt}</div>
                    <div className="text-label-sm text-on-surface-variant/70">{entry.timestamp}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
