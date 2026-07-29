"use client";

import { useState } from "react";
import {
  Bookmark,
  Check,
  ChevronDown,
  Copy,
  Download,
  Lightbulb,
  Play,
  Share2,
  Sparkles,
} from "lucide-react";
import { SQL_DIALECTS, type SqlDialect } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

interface GeneratorToolbarProps {
  dialect: SqlDialect;
  onDialectChange: (dialect: SqlDialect) => void;
  onCopy: () => void;
  onDownload: () => void;
  onSave: () => void;
  onShare: () => void;
  onToggleExplain: () => void;
  onToggleOptimize: () => void;
  onRun: () => void;
  saved?: boolean;
  explainActive?: boolean;
  optimizeActive?: boolean;
  running?: boolean;
}

function ToolbarButton({
  icon: Icon,
  label,
  onClick,
  active,
  filled,
}: {
  icon: typeof Copy;
  label: string;
  onClick: () => void;
  active?: boolean;
  filled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex items-center gap-xs px-md py-2 rounded-lg font-label-md transition-colors border",
        active
          ? "bg-primary/10 text-primary border-primary/30"
          : "bg-surface-container-lowest text-on-surface-variant border-outline-variant hover:bg-surface-container-low hover:text-on-surface"
      )}
    >
      <Icon className={cn("h-4 w-4", filled && "fill-current")} aria-hidden="true" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

export function GeneratorToolbar({
  dialect,
  onDialectChange,
  onCopy,
  onDownload,
  onSave,
  onShare,
  onToggleExplain,
  onToggleOptimize,
  onRun,
  saved = false,
  explainActive = false,
  optimizeActive = false,
  running = false,
}: GeneratorToolbarProps) {
  const [dialectOpen, setDialectOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex items-center gap-sm flex-wrap p-md border-b border-border-subtle bg-surface-container-lowest">
      <ToolbarButton icon={copied ? Check : Copy} label={copied ? "Copied" : "Copy"} onClick={handleCopy} />
      <ToolbarButton icon={Download} label="Download" onClick={onDownload} />
      <ToolbarButton icon={Bookmark} label={saved ? "Saved" : "Save"} onClick={onSave} active={saved} filled={saved} />
      <ToolbarButton icon={Share2} label="Share" onClick={onShare} />

      <div className="w-px h-6 bg-border-subtle mx-1 hidden sm:block" />

      <ToolbarButton icon={Sparkles} label="Explain" onClick={onToggleExplain} active={explainActive} />
      <ToolbarButton icon={Lightbulb} label="Optimize" onClick={onToggleOptimize} active={optimizeActive} />

      <div className="relative">
        <button
          type="button"
          onClick={() => setDialectOpen((v) => !v)}
          aria-expanded={dialectOpen}
          className="flex items-center gap-xs px-md py-2 rounded-lg font-label-md border border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low transition-colors"
        >
          <span className="font-mono text-label-sm">{dialect}</span>
          <ChevronDown className="h-4 w-4" aria-hidden="true" />
        </button>
        {dialectOpen && (
          <div className="absolute left-0 mt-2 w-40 bg-surface-container-lowest border border-outline-variant rounded-lg shadow-elevation-3 overflow-hidden z-20 animate-scale-in">
            {SQL_DIALECTS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => {
                  onDialectChange(d);
                  setDialectOpen(false);
                }}
                className={cn(
                  "w-full text-left px-md py-2 text-body-md transition-colors",
                  d === dialect
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-on-surface-variant hover:bg-surface-container-low"
                )}
              >
                {d}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1" />

      <button
        type="button"
        onClick={onRun}
        disabled={running}
        className="flex items-center gap-xs px-lg py-2 rounded-lg font-label-md font-semibold bg-success text-on-success hover:brightness-110 active:scale-95 transition-all disabled:opacity-60"
      >
        <Play className="h-4 w-4" aria-hidden="true" />
        {running ? "Running…" : "Run Query"}
      </button>
    </div>
  );
}
