"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Download,
  Filter,
  Search,
  Star,
  Timer,
  XCircle,
} from "lucide-react";
import { PageHeader } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { LoadingReveal } from "@/components/ui/LoadingReveal";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { HistoryTable } from "@/components/history/HistoryTable";
import { InsightsPanel } from "@/components/history/InsightsPanel";
import { useToast } from "@/components/ui/Toast";
import { QUERY_HISTORY } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

type FilterKey = "all" | "success" | "failed" | "long-running" | "favorites";

const FILTERS: { key: FilterKey; label: string; icon: typeof CheckCircle2 }[] = [
  { key: "all", label: "All Queries", icon: Filter },
  { key: "success", label: "Success", icon: CheckCircle2 },
  { key: "failed", label: "Failed", icon: XCircle },
  { key: "long-running", label: "Long Running", icon: Timer },
  { key: "favorites", label: "Favorites", icon: Star },
];

export default function QueryHistoryPage() {
  const { showToast } = useToast();
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");

  const filteredEntries = useMemo(() => {
    let entries = QUERY_HISTORY;
    if (activeFilter === "success") entries = entries.filter((e) => e.status === "success");
    if (activeFilter === "failed") entries = entries.filter((e) => e.status === "error");
    if (activeFilter === "long-running") entries = entries.filter((e) => (e.executionMs ?? 0) > 500);
    if (activeFilter === "favorites") entries = entries.filter((e) => e.isFavorite);

    if (search.trim()) {
      const q = search.toLowerCase();
      entries = entries.filter((e) => e.sqlFull.toLowerCase().includes(q));
    }
    return entries;
  }, [activeFilter, search]);

  function handleExport() {
    const rows = filteredEntries.map((e) => ({
      status: e.status,
      database: e.database,
      sql: e.sqlFull,
      executionMs: e.executionMs,
      rowCount: e.rowCount,
      timestamp: e.timestampLabel,
    }));
    const blob = new Blob([JSON.stringify(rows, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "query-history.json";
    link.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${rows.length} quer${rows.length === 1 ? "y" : "ies"}`);
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <LoadingReveal skeleton={<PageSkeleton />}>
      <PageHeader
        title="Query History"
        description="Analyze and re-run your previous database interactions."
        actions={
          <>
            <button
              onClick={() => showToast("Custom date-range filtering isn't available in this demo yet")}
              className="bg-surface-container-lowest border border-border-subtle rounded-lg px-md py-sm flex items-center gap-sm text-label-md text-on-surface-variant hover:bg-surface-container-low transition-colors"
            >
              <CalendarDays className="h-[13.5px] w-[13.5px] text-outline" aria-hidden="true" />
              Last 7 Days
              <ChevronDown className="h-[13.5px] w-[13.5px] text-outline" aria-hidden="true" />
            </button>
            <button
              onClick={handleExport}
              aria-label="Export query history"
              className="bg-primary text-on-primary p-sm rounded-lg hover:brightness-110 transition-all"
            >
              <Download className="h-5 w-5" aria-hidden="true" />
            </button>
          </>
        }
      />

      <div className="px-lg md:px-2xl pb-2xl flex flex-col gap-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-md">
          <div className="flex items-center gap-sm flex-wrap">
            {FILTERS.map((filter) => {
              const isActive = activeFilter === filter.key;
              return (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => setActiveFilter(filter.key)}
                  aria-pressed={isActive}
                  className={cn(
                    "flex items-center gap-xs px-md py-1.5 rounded-full font-label-md transition-colors border",
                    isActive
                      ? "bg-primary-container text-on-primary-container border-primary-container shadow-elevation-1"
                      : "bg-surface-container-lowest border-outline-variant text-on-surface-variant hover:bg-surface-container-low"
                  )}
                >
                  <filter.icon className="h-[13.5px] w-[13.5px]" aria-hidden="true" />
                  {filter.label}
                </button>
              );
            })}
          </div>

          <label className="flex items-center gap-sm bg-surface-container-lowest border border-outline-variant rounded-lg px-md py-1.5 w-full md:w-64">
            <Search className="h-5 w-5 text-outline shrink-0" aria-hidden="true" />
            <span className="sr-only">Filter by SQL content</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-label-md w-full placeholder:text-outline p-0"
              placeholder="Filter by SQL content…"
              type="text"
            />
          </label>
        </div>

        <div className="flex flex-col xl:flex-row gap-lg items-start">
          <Card className="flex-1 w-full overflow-hidden">
            {filteredEntries.length === 0 ? (
              <div className="py-2xl flex flex-col items-center gap-2 text-center">
                <Search className="h-8 w-8 text-outline-variant" aria-hidden="true" />
                <p className="text-body-md text-on-surface-variant">
                  No queries match this filter yet.
                </p>
              </div>
            ) : (
              <HistoryTable entries={filteredEntries} />
            )}
            <div className="px-lg py-md bg-surface-container-lowest border-t border-border-subtle flex justify-between items-center">
              <span className="font-label-sm text-on-surface-variant">
                Showing {filteredEntries.length} of {filteredEntries.length} queries
              </span>
              <div className="flex gap-xs">
                <button
                  disabled
                  aria-label="Previous page"
                  className="p-1 rounded hover:bg-surface-variant border border-outline-variant disabled:opacity-50"
                >
                  <ChevronDown className="h-5 w-5 rotate-90" aria-hidden="true" />
                </button>
                <button
                  disabled
                  aria-current="page"
                  className="px-2 py-1 rounded font-label-md bg-primary text-on-primary disabled:opacity-100"
                >
                  1
                </button>
                <button
                  disabled
                  aria-label="Next page"
                  className="p-1 rounded hover:bg-surface-variant border border-outline-variant disabled:opacity-50"
                >
                  <ChevronDown className="h-5 w-5 -rotate-90" aria-hidden="true" />
                </button>
              </div>
            </div>
          </Card>

          <div className="w-full xl:w-auto">
            <InsightsPanel />
          </div>
        </div>
      </div>
      </LoadingReveal>
    </div>
  );
}
