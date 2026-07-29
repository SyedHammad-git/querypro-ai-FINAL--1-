"use client";

import { useRef } from "react";
import type { ChangeEvent, SyntheticEvent, UIEvent } from "react";
import { highlightSql } from "@/lib/sql-highlight";

interface SqlCodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  "aria-label"?: string;
  /** Reports 1-indexed line/column of the caret, for a status-bar readout. */
  onCursorChange?: (position: { line: number; column: number }) => void;
}

/**
 * A real, editable SQL editor: a transparent-text `<textarea>` layered over
 * a syntax-highlighted `<pre>`, with a synced line-number gutter — the
 * classic "editor overlay" technique, lightweight enough to avoid a full
 * CodeMirror/Monaco dependency while still giving genuine tweak-and-run
 * editing with live highlighting.
 *
 * All color tokens now use `code-gutter` (a CSS-variable-backed Tailwind
 * token) instead of raw `white/*` so they remain visible in light mode,
 * where the code surface uses a softer dark-navy rather than the full
 * #0a0e18 used in dark mode.
 */
export function SqlCodeEditor({
  value,
  onChange,
  disabled = false,
  "aria-label": ariaLabel = "SQL editor",
  onCursorChange,
}: SqlCodeEditorProps) {
  const preRef = useRef<HTMLPreElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  const lineCount = value.split("\n").length;

  function handleScroll(event: UIEvent<HTMLTextAreaElement>) {
    const { scrollTop, scrollLeft } = event.currentTarget;
    if (preRef.current) {
      preRef.current.scrollTop = scrollTop;
      preRef.current.scrollLeft = scrollLeft;
    }
    if (gutterRef.current) {
      gutterRef.current.scrollTop = scrollTop;
    }
  }

  function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
    onChange(event.target.value);
  }

  function reportCursor(event: SyntheticEvent<HTMLTextAreaElement>) {
    if (!onCursorChange) return;
    const pos = event.currentTarget.selectionStart;
    const upToCaret = value.slice(0, pos);
    const lines = upToCaret.split("\n");
    onCursorChange({ line: lines.length, column: (lines[lines.length - 1]?.length ?? 0) + 1 });
  }

  const sharedTextStyles = "font-mono text-body-md leading-relaxed whitespace-pre p-lg";

  return (
    <div className="relative flex-1 min-h-0 flex overflow-hidden">
      {/* Line-number gutter — 1 row per source line, scroll-synced. */}
      <div
        ref={gutterRef}
        aria-hidden="true"
        className="w-12 shrink-0 overflow-hidden bg-gray-50/50 dark:bg-white/[0.06] border-r border-gray-200 dark:border-white/10 select-none"
      >
        <div className="font-mono text-body-md leading-relaxed pt-lg pb-lg text-right">
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i} className="px-sm text-gray-400 dark:text-white/30">
              {i + 1}
            </div>
          ))}
        </div>
      </div>

      <div className="relative flex-1 min-h-0 overflow-hidden">
        <pre
          ref={preRef}
          aria-hidden="true"
          className={`absolute inset-0 overflow-auto scrollbar-thin-dark pointer-events-none ${sharedTextStyles}`}
        >
          <code>{highlightSql(value)}</code>
          {/* Trailing newline keeps scroll height in sync with textarea. */}
          {"\n"}
        </pre>
        <textarea
          value={value}
          onChange={handleChange}
          onScroll={handleScroll}
          onSelect={reportCursor}
          onKeyUp={reportCursor}
          onClick={reportCursor}
          disabled={disabled}
          spellCheck={false}
          aria-label={ariaLabel}
          className={`absolute inset-0 w-full h-full bg-transparent text-transparent caret-gray-900 dark:caret-white/80 resize-none outline-none overflow-auto scrollbar-thin-dark ${sharedTextStyles}`}
        />
      </div>
    </div>
  );
}
