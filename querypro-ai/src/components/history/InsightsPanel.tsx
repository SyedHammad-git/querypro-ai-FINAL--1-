"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Database, Hash, TrendingUp } from "lucide-react";
import type { QueryHistoryEntry } from "@/lib/types";
import { cn } from "@/lib/utils";

export function InsightsPanel() {
  const router = useRouter();
  const [entries, setEntries] = useState<QueryHistoryEntry[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadHistory() {
      try {
        const response = await fetch("/api/history/save");
        const payload = await response.json();
        if (!response.ok || !payload.success) throw new Error(payload.error || "Unable to load history");

        const mappedEntries: QueryHistoryEntry[] = (payload.history ?? []).map((item: { id: string; query: string; status: string; durationMs: number | null; createdAt: string }) => {
          const status = item.status === "error" ? "error" : item.status === "running" ? "running" : "success";
          const sql = item.query?.trim() ?? "";
          return {
            id: item.id,
            status,
            sqlSnippet: sql.length > 32 ? `${sql.slice(0, 29)}…` : sql || "Empty query",
            sqlFull: sql,
            database: "PGlite / Local DB",
            executionMs: item.durationMs ?? null,
            rowCount: null,
            timestampLabel: "just now",
            isFavorite: false,
          };
        });

        if (!cancelled) {
          setEntries(mappedEntries);
        }
      } catch {
        if (!cancelled) {
          setEntries([]);
        }
      }
    }

    void loadHistory();
    return () => {
      cancelled = true;
    };
  }, []);

  const trendValues = useMemo(() => {
    if (!entries.length) return [];

    return Array.from({ length: Math.min(6, entries.length) }, (_, index) => {
      const entry = entries[entries.length - 1 - index];
      if (!entry?.executionMs) return 0;
      return Math.max(0, Math.min(100, Math.round(entry.executionMs / 12)));
    }).reverse();
  }, [entries]);

  const averageExecutionMs = useMemo(() => {
    if (!entries.length) return null;
    const total = entries.reduce((sum, entry) => sum + (entry.executionMs ?? 0), 0);
    return Math.round(total / entries.length);
  }, [entries]);

  const successRate = useMemo(() => {
    if (!entries.length) return null;
    const successes = entries.filter((entry) => entry.status === "success").length;
    return Math.round((successes / entries.length) * 100);
  }, [entries]);

  const commonKeywords = useMemo(() => {
    const counts = new Map<string, number>();
    for (const entry of entries) {
      const keywords = entry.sqlFull.match(/\b(SELECT|JOIN|UPDATE|DELETE|INSERT|CREATE)\b/gi) ?? [];
      for (const keyword of keywords) {
        const normalized = keyword.toUpperCase();
        counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
      }
    }

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([keyword, count]) => ({ keyword, percentage: Math.max(12, Math.round((count / Math.max(entries.length, 1)) * 100)) }));
  }, [entries]);

  return (
    <aside
      className="w-full xl:w-80 shrink-0 bg-surface-container-lowest border border-border-subtle rounded shadow-elevation-1 p-lg flex flex-col gap-xl"
      aria-label="Query insights"
    >
      <div>
        <h3 className="font-mono text-label-md text-on-surface-variant uppercase tracking-wider mb-lg flex items-center justify-between">
          Performance Trends
          <TrendingUp className="h-[13.5px] w-[13.5px]" aria-hidden="true" />
        </h3>
        <div className="bg-surface-container-low rounded-xl p-md border border-border-subtle">
          <div className="flex items-end justify-between h-24 gap-1 mb-md" role="img" aria-label="Query execution time trend over the last 24 hours">
            {trendValues.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center rounded border border-dashed border-border-subtle bg-surface-container-lowest text-sm text-on-surface-variant">
                Not enough data yet
              </div>
            ) : (
              trendValues.map((value, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex-1 rounded-t-sm",
                    i === trendValues.length - 2 ? "bg-primary/40" : "bg-primary/20",
                    i === trendValues.length - 1 && "bg-primary"
                  )}
                  style={{ height: `${value}%` }}
                />
              ))
            )}
          </div>
          <div className="flex justify-between font-mono text-label-sm text-outline">
            <span>24h ago</span>
            <span>Now</span>
          </div>
          <div className="mt-lg pt-lg border-t border-border-subtle flex justify-between">
            <div>
              <div className="text-[7.5px] text-outline uppercase">Avg. Time</div>
              <div className="font-heading text-headline-sm text-on-surface">{averageExecutionMs === null ? "—" : `${averageExecutionMs}ms`}</div>
            </div>
            <div className="text-right">
              <div className="text-[7.5px] text-outline uppercase">Success Rate</div>
              <div className="font-heading text-headline-sm text-success">{successRate === null ? "—" : `${successRate}%`}</div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-mono text-label-md text-on-surface-variant uppercase tracking-wider mb-lg flex items-center justify-between">
          Common Keywords
          <Hash className="h-[13.5px] w-[13.5px]" aria-hidden="true" />
        </h3>
        <div className="flex flex-wrap gap-sm">
          {commonKeywords.length === 0 ? (
            <p className="text-sm text-on-surface-variant">Run a few queries to see keyword activity here.</p>
          ) : (
            commonKeywords.map((k) => (
              <div
                key={k.keyword}
                className="bg-surface-container-high px-md py-sm rounded-lg flex items-center gap-md border border-border-subtle w-full"
              >
                <span className="font-mono text-label-md text-primary font-bold w-16 shrink-0">
                  {k.keyword}
                </span>
                <div className="h-1 flex-1 bg-surface-variant rounded-full">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${k.percentage}%` }} />
                </div>
                <span className="font-mono text-label-sm text-on-surface-variant w-9 text-right">
                  {k.percentage}%
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <div>
        <h3 className="font-mono text-label-md text-on-surface-variant uppercase tracking-wider mb-lg">
          Backend Status
        </h3>
        <ul className="space-y-sm">
          <li>
            <button
              type="button"
              onClick={() => router.push("/settings")}
              className="w-full flex items-center gap-md p-sm hover:bg-surface-container-low rounded-lg transition-colors border border-transparent hover:border-border-subtle text-left"
            >
              <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Database className="h-[13.5px] w-[13.5px]" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <div className="font-mono text-label-md truncate">Prisma + PGlite</div>
                <div className={cn("text-[7.5px] font-bold", "text-success")}>CONNECTED</div>
              </div>
            </button>
          </li>
        </ul>
      </div>
    </aside>
  );
}
