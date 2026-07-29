"use client";

import { useRouter } from "next/navigation";
import { Database, Lightbulb } from "lucide-react";
import type { SchemaTable } from "@/lib/types";
import { DRAFT_SQL_STORAGE_KEY, formatCount } from "@/lib/utils";

export function SchemaPreviewPanel({ table }: { table: SchemaTable }) {
  const router = useRouter();
  const previewColumns = table.previewRows[0] ? Object.keys(table.previewRows[0]) : [];

  function handleViewAll() {
    // Same hand-off pattern Saved Queries and Templates use to seed Workspace.
    sessionStorage.setItem(DRAFT_SQL_STORAGE_KEY, `SELECT * FROM ${table.name};`);
    router.push("/workspace");
  }

  return (
    <aside
      className="w-80 shrink-0 bg-surface-container-low border-l border-border-subtle flex flex-col overflow-y-auto scrollbar-thin"
      aria-label="Table preview"
    >
      <div className="p-lg space-y-lg">
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-sm">
            <h3 className="font-label-md text-on-surface font-semibold">Quick Preview</h3>
            <button type="button" onClick={handleViewAll} className="text-primary text-[9px] font-semibold hover:underline">
              View All
            </button>
          </div>
          <div className="bg-white dark:bg-black border border-gray-200 dark:border-transparent rounded-xl p-md overflow-hidden flex flex-col">
            <div className="overflow-auto scrollbar-thin-dark font-mono text-gray-900 dark:text-white/80">
              {previewColumns.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-lg text-center">
                  <Database className="h-6 w-6 text-gray-400 dark:text-white/30" aria-hidden="true" />
                  <p className="text-[8.25px] text-gray-400 dark:text-white/40">No sampled rows for this object.</p>
                </div>
              ) : (
                <table className="w-full text-[8.25px]">
                  <thead className="border-b border-gray-200 dark:border-white/10">
                    <tr className="text-primary-fixed-dim">
                      {previewColumns.map((col) => (
                        <th key={col} className="pb-1 pr-2 text-left font-medium">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                    {table.previewRows.map((row, i) => (
                      <tr key={i}>
                        {previewColumns.map((col) => (
                          <td key={col} className="py-1 pr-2 text-secondary-fixed-dim">
                            {row[col]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="mt-md pt-md border-t border-gray-200 dark:border-white/10 flex items-center justify-between">
              <span className="text-[7.5px] text-gray-500 dark:text-white/40 uppercase tracking-widest">
                Previewing {table.previewRows.length} of {formatCount(table.rowCount)}
              </span>
              <Database className="h-3.5 w-3.5 text-gray-400 dark:text-white/40" aria-hidden="true" />
            </div>
          </div>
        </div>

        <div className="p-md bg-primary/5 rounded-lg border border-primary/10">
          <div className="flex items-start gap-sm">
            <Lightbulb className="h-5 w-5 text-primary shrink-0" aria-hidden="true" />
            <p className="text-xs text-on-surface-variant leading-relaxed">
              <strong className="text-on-surface">Pro Tip:</strong> Hover over constraint icons to
              see referenced tables and definitions.
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
