"use client";

import { useState } from "react";
import { Check, Code2, Copy, Play, Save, WrapText } from "lucide-react";
import { SqlCodeEditor } from "./SqlCodeEditor";
import { Button } from "@/components/ui/Button";

interface SqlWorkspaceEditorProps {
  filename: string;
  value: string;
  onChange: (value: string) => void;
  onRun: () => void;
  onSave?: () => void;
  saving?: boolean;
  running?: boolean;
  onCursorChange?: (position: { line: number; column: number }) => void;
}

export function SqlWorkspaceEditor({
  filename,
  value,
  onChange,
  onRun,
  onSave,
  saving = false,
  running = false,
  onCursorChange,
}: SqlWorkspaceEditorProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable in this context — no-op.
    }
  }

  function handleFormat() {
    const formatted = value
      .split("\n")
      .map((line) => line.replace(/\s+$/, ""))
      .join("\n")
      .replace(/\n{3,}/g, "\n\n");
    onChange(formatted);
  }

  return (
    <section
      className="flex-1 flex flex-col bg-white dark:bg-black min-h-0 rounded shadow-elevation-1 overflow-hidden border border-gray-200 dark:border-transparent"
      aria-label="Advanced SQL editor"
    >
      <div className="h-12 shrink-0 flex items-center justify-between px-lg bg-gray-50 dark:bg-[#171b26] border-b border-gray-200 dark:border-white/10">
        <div className="flex items-center gap-md min-w-0">
          <Code2 className="h-5 w-5 text-gray-500 dark:text-white/40 shrink-0" aria-hidden="true" />
          <span className="font-mono text-label-md text-gray-900 dark:text-white/80 truncate">{filename}</span>
        </div>
        <div className="flex items-center gap-md shrink-0">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-xs px-md py-1 text-label-sm text-gray-600 dark:text-white/60 hover:text-gray-900 dark:hover:text-white transition-all bg-gray-100 dark:bg-white/5 rounded border border-gray-200 dark:border-white/10"
          >
            {copied ? (
              <Check className="h-4 w-4 text-success" aria-hidden="true" />
            ) : (
              <Copy className="h-4 w-4" aria-hidden="true" />
            )}
            {copied ? "Copied" : "Copy"}
          </button>
          <button
            type="button"
            onClick={handleFormat}
            className="flex items-center gap-xs px-md py-1 text-label-sm text-gray-600 dark:text-white/60 hover:text-gray-900 dark:hover:text-white transition-all bg-gray-100 dark:bg-white/5 rounded border border-gray-200 dark:border-white/10"
          >
            <WrapText className="h-4 w-4" aria-hidden="true" />
            Format
          </button>
          {onSave && (
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="flex items-center gap-xs px-md py-1 text-label-sm text-gray-600 dark:text-white/60 hover:text-gray-900 dark:hover:text-white transition-all bg-gray-100 dark:bg-white/5 rounded border border-gray-200 dark:border-white/10 disabled:opacity-50"
            >
              <Save className="h-4 w-4" aria-hidden="true" />
              {saving ? "Saving…" : "Save"}
            </button>
          )}
          <Button
            size="sm"
            onClick={onRun}
            disabled={running}
            className="bg-success text-on-success hover:brightness-110 rounded-full shadow-[0_0_12px_rgba(52,211,153,0.25)] px-lg"
          >
            <Play className="h-4 w-4" aria-hidden="true" />
            {running ? "Running…" : "Run Query"}
          </Button>
        </div>
      </div>
      <SqlCodeEditor
        value={value}
        onChange={onChange}
        disabled={running}
        aria-label={`Editing ${filename}`}
        onCursorChange={onCursorChange}
      />
    </section>
  );
}
