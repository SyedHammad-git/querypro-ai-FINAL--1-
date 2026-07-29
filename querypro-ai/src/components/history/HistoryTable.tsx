"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, CheckCircle2, Copy, PlayCircle, XCircle } from "lucide-react";
import type { QueryHistoryEntry } from "@/lib/types";
import { DRAFT_SQL_STORAGE_KEY, formatCount, formatDuration } from "@/lib/utils";
import { highlightSql } from "@/lib/sql-highlight";
import { cn } from "@/lib/utils";

function durationBarWidth(ms: number): string {
  const pct = Math.min(100, Math.round((ms / 1500) * 100));
  return `${Math.max(pct, 4)}%`;
}

function HistoryRow({ entry }: { entry: QueryHistoryEntry }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const isSuccess = entry.status === "success";

  async function handleCopy(event: React.MouseEvent) {
    event.stopPropagation();
    try {
      await navigator.clipboard.writeText(entry.sqlFull);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable — no-op.
    }
  }

  function openInEditor(event: React.MouseEvent) {
    event.stopPropagation();
    sessionStorage.setItem(DRAFT_SQL_STORAGE_KEY, entry.sqlFull);
    router.push("/workspace");
  }

  return (
    <>
      <tr
        className="group hover:bg-surface-container-lowest transition-colors cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <td className="px-lg py-md">
          {isSuccess ? (
            <CheckCircle2 className="h-5 w-5 text-success" aria-label="Success" />
          ) : (
            <XCircle className="h-5 w-5 text-error" aria-label="Error" />
          )}
        </td>
        <td className="px-lg py-md max-w-xs">
          <code
            className={cn(
              "font-mono text-label-md px-2 py-1 rounded block truncate",
              isSuccess ? "text-primary bg-primary/5" : "text-error bg-error/5"
            )}
          >
            {entry.sqlSnippet}
          </code>
        </td>
        <td className="px-lg py-md font-sans text-body-md text-on-surface whitespace-nowrap">
          {entry.database}
        </td>
        <td className="px-lg py-md">
          <div className="flex items-center gap-xs">
            <div className="w-16 h-1.5 bg-surface-variant rounded-full overflow-hidden">
              <div
                className={cn("h-full", isSuccess ? "bg-primary" : "bg-error")}
                style={{ width: durationBarWidth(entry.executionMs ?? 0) }}
              />
            </div>
            <span className="font-mono text-label-sm text-on-surface-variant whitespace-nowrap">
              {entry.executionMs === null ? "—" : formatDuration(entry.executionMs)}
            </span>
          </div>
        </td>
        <td
          className={cn(
            "px-lg py-md font-mono text-label-md text-right whitespace-nowrap",
            !isSuccess && "text-error"
          )}
        >
          {entry.rowCount === null ? "—" : formatCount(entry.rowCount)}
        </td>
        <td className="px-lg py-md font-mono text-label-md text-on-surface-variant text-right whitespace-nowrap">
          {entry.timestampLabel}
        </td>
        <td className="px-lg py-md">
          <div className="flex items-center justify-end gap-sm opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
            <button
              type="button"
              title="Re-run"
              aria-label="Re-run query"
              onClick={openInEditor}
              className="p-1.5 rounded hover:bg-surface-variant text-primary"
            >
              <PlayCircle className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              title="Copy"
              aria-label="Copy query"
              onClick={handleCopy}
              className="p-1.5 rounded hover:bg-surface-variant text-on-surface-variant"
            >
              {copied ? (
                <Check className="h-5 w-5 text-success" aria-hidden="true" />
              ) : (
                <Copy className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </td>
      </tr>

      {expanded && (
        <tr className="bg-surface-container-low/50">
          <td className="px-lg py-lg" colSpan={7}>
            {!isSuccess && entry.errorMessage && (
              <div className="bg-error-container/30 border border-error/20 rounded-lg p-lg mb-md">
                <div className="flex items-center gap-sm text-error font-bold mb-1">
                  <XCircle className="h-5 w-5" aria-hidden="true" />
                  {entry.errorMessage}
                </div>
                {entry.errorLine && (
                  <p className="text-on-error-container text-sm font-mono">{entry.errorLine}</p>
                )}
              </div>
            )}
            <div className="bg-white dark:bg-black border border-gray-200 dark:border-transparent rounded-lg p-lg font-mono relative">
              <pre className="whitespace-pre-wrap text-body-md leading-relaxed">
                <code>{highlightSql(entry.sqlFull)}</code>
              </pre>
              <div className="absolute top-lg right-lg flex gap-md">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 px-md py-1 rounded text-gray-600 dark:text-white/80 text-xs transition-colors"
                >
                  {copied ? "Copied" : "Copy Code"}
                </button>
                <button
                  type="button"
                  onClick={openInEditor}
                  className="bg-primary hover:brightness-110 px-md py-1 rounded text-white text-xs transition-all"
                >
                  Open in Editor
                </button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export function HistoryTable({ entries }: { entries: QueryHistoryEntry[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-surface-container-low border-b border-border-subtle">
            <th className="px-lg py-md font-mono text-label-sm text-on-surface-variant uppercase tracking-wider">
              Status
            </th>
            <th className="px-lg py-md font-mono text-label-sm text-on-surface-variant uppercase tracking-wider">
              SQL Snippet
            </th>
            <th className="px-lg py-md font-mono text-label-sm text-on-surface-variant uppercase tracking-wider">
              Database
            </th>
            <th className="px-lg py-md font-mono text-label-sm text-on-surface-variant uppercase tracking-wider">
              Execution
            </th>
            <th className="px-lg py-md font-mono text-label-sm text-on-surface-variant uppercase tracking-wider text-right">
              Rows
            </th>
            <th className="px-lg py-md font-mono text-label-sm text-on-surface-variant uppercase tracking-wider text-right">
              Timestamp
            </th>
            <th className="px-lg py-md" aria-label="Row actions" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle">
          {entries.map((entry) => (
            <HistoryRow key={entry.id} entry={entry} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
