"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, List, Terminal, Timer } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import type { QueryResult } from "@/lib/types";
import { cn, formatCount } from "@/lib/utils";

const STATUS_STYLES: Record<QueryResult["status"], string> = {
  success: "bg-success/10 text-success border-success/20",
  error: "bg-error/10 text-error border-error/20",
  running: "bg-primary/10 text-primary border-primary/20",
};

const STATUS_LABEL: Record<QueryResult["status"], string> = {
  success: "SUCCESS",
  error: "FAILED",
  running: "RUNNING",
};

export function ResultsConsole({ result }: { result: QueryResult | null }) {
  const [collapsed, setCollapsed] = useState(false);

  if (!result) {
    return (
      <section
        className="shrink-0 max-h-[300px] bg-surface-container-lowest border-t border-border-subtle flex flex-col items-center justify-center shadow-[0_-3px_9px_-3px_rgba(0,0,0,0.05)]"
        aria-label="Execution results"
      >
        <div className="py-xl">
          <EmptyState
            icon={Terminal}
            title="No query run yet"
            description="Run a query to see live results from the real PostgreSQL engine here."
          />
        </div>
      </section>
    );
  }

  return (
    <section
      className={cn(
        "shrink-0 bg-surface-container-lowest border-t border-border-subtle flex flex-col shadow-[0_-3px_9px_-3px_rgba(0,0,0,0.05)] transition-all duration-200 z-10",
        collapsed ? "h-12" : "flex-1 basis-[300px] max-h-[300px] min-h-[150px]"
      )}
      aria-label="Execution results"
    >
      <div className="h-12 shrink-0 flex items-center justify-between px-lg border-b border-border-subtle bg-surface-container-low">
        <div className="flex items-center gap-xl min-w-0">
          <div className="flex items-center gap-sm">
            <Terminal className="h-5 w-5 text-primary" aria-hidden="true" />
            <span className="font-label-md font-semibold text-on-surface">Execution Results</span>
          </div>
          <div className="hidden sm:flex items-center gap-lg">
            <span className="text-label-sm text-on-surface-variant flex items-center gap-xs">
              <Timer className="h-3.5 w-3.5" aria-hidden="true" />
              Execution Time:&nbsp;<b className="text-on-surface font-mono">{result.executionMs}ms</b>
            </span>
            <span className="text-label-sm text-on-surface-variant flex items-center gap-xs">
              <List className="h-3.5 w-3.5" aria-hidden="true" />
              Total Records:&nbsp;<b className="text-on-surface font-mono">{formatCount(result.rowCount)}</b>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-md shrink-0">
          <span
            className={cn(
              "px-md py-1 text-label-sm rounded-full font-semibold border",
              STATUS_STYLES[result.status]
            )}
          >
            {STATUS_LABEL[result.status]}
          </span>
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? "Expand results" : "Collapse results"}
            aria-expanded={!collapsed}
            className="p-1 hover:bg-surface-container-highest rounded transition-colors text-outline"
          >
            {collapsed ? (
              <ChevronUp className="h-5 w-5" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="flex-1 overflow-auto scrollbar-thin">
          {result.status === "error" ? (
            <div className="p-lg">
              <div className="flex items-start gap-md p-lg rounded-lg border border-error/30 bg-error/5">
                <AlertTriangle className="h-5 w-5 text-error shrink-0 mt-0.5" aria-hidden="true" />
                <div className="min-w-0 flex-1 space-y-xs">
                  <div className="flex items-center gap-sm flex-wrap">
                    <span className="font-label-md font-semibold text-error">SQL Error</span>
                    {result.errorCode && (
                      <span className="px-xs py-0.5 text-label-sm font-mono rounded border border-error/30 text-error bg-error/10">
                        {result.errorCode}
                      </span>
                    )}
                  </div>
                  <p className="font-mono text-body-sm text-error whitespace-pre-wrap break-words">
                    {result.errorMessage}
                  </p>
                  {result.errorHint && (
                    <p className="text-body-sm text-on-surface-variant">
                      <span className="font-semibold text-on-surface">Hint:</span> {result.errorHint}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : result.columns.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-sm text-on-surface-variant">
              <CheckCircle2 className="h-6 w-6 text-success" aria-hidden="true" />
              <p className="text-body-md">
                Query OK — {formatCount(result.rowCount)} row{result.rowCount === 1 ? "" : "s"} affected.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-container-low/50 sticky top-0 text-label-sm text-outline border-b border-border-subtle">
                <tr>
                  {result.columns.map((col) => (
                    <th key={col.key} className="px-lg py-md font-medium whitespace-nowrap">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle text-body-md text-on-surface-variant">
                {result.rows.length === 0 ? (
                  <tr>
                    <td colSpan={result.columns.length} className="px-lg py-xl text-center text-on-surface-variant">
                      Query ran successfully — 0 rows matched.
                    </td>
                  </tr>
                ) : (
                  result.rows.map((row, i) => (
                    <tr key={i} className="hover:bg-surface-container-low transition-colors">
                      {result.columns.map((col) => (
                        <td
                          key={col.key}
                          className={cn(
                            "px-lg py-md whitespace-nowrap",
                            col.key === "id" && "font-mono text-on-surface",
                            row[col.key] === "NULL" && "italic text-outline"
                          )}
                        >
                          {row[col.key]}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      )}
    </section>
  );
}
