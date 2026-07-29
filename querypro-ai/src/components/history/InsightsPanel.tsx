"use client";

import { useRouter } from "next/navigation";
import { Database, Hash, Server, TrendingUp } from "lucide-react";
import { CONNECTED_DATABASES, KEYWORD_USAGE, PERFORMANCE_TRENDS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  stable: { label: "STABLE", className: "text-success" },
  vacuuming: { label: "VACUUMING", className: "text-tertiary" },
  syncing: { label: "SYNCING", className: "text-primary" },
};

const DB_ICON = { database: Database, server: Server } as const;

export function InsightsPanel() {
  const router = useRouter();
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
            {PERFORMANCE_TRENDS.map((value, i) => (
              <div
                key={i}
                className={cn(
                  "flex-1 rounded-t-sm",
                  i === PERFORMANCE_TRENDS.length - 2 ? "bg-primary/40" : "bg-primary/20",
                  i === PERFORMANCE_TRENDS.length - 1 && "bg-primary"
                )}
                style={{ height: `${value}%` }}
              />
            ))}
          </div>
          <div className="flex justify-between font-mono text-label-sm text-outline">
            <span>24h ago</span>
            <span>Now</span>
          </div>
          <div className="mt-lg pt-lg border-t border-border-subtle flex justify-between">
            <div>
              <div className="text-[7.5px] text-outline uppercase">Avg. Time</div>
              <div className="font-heading text-headline-sm text-on-surface">82ms</div>
            </div>
            <div className="text-right">
              <div className="text-[7.5px] text-outline uppercase">Success Rate</div>
              <div className="font-heading text-headline-sm text-success">99.4%</div>
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
          {KEYWORD_USAGE.map((k) => (
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
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-mono text-label-md text-on-surface-variant uppercase tracking-wider mb-lg">
          Connected DBs
        </h3>
        <ul className="space-y-sm">
          {CONNECTED_DATABASES.map((db) => {
            const Icon = DB_ICON[db.icon as keyof typeof DB_ICON] ?? Database;
            const status = STATUS_LABEL[db.status];
            return (
              <li key={db.id}>
                <button
                  type="button"
                  onClick={() => router.push("/settings")}
                  className="w-full flex items-center gap-md p-sm hover:bg-surface-container-low rounded-lg transition-colors border border-transparent hover:border-border-subtle text-left"
                >
                  <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Icon className="h-[13.5px] w-[13.5px]" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-mono text-label-md truncate">{db.name}</div>
                    <div className={cn("text-[7.5px] font-bold", status?.className)}>
                      {status?.label}
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
