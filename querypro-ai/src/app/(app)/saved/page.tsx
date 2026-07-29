"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, Play, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/AppShell";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoadingReveal } from "@/components/ui/LoadingReveal";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { CodeBlock } from "@/components/sql/CodeBlock";
import { EmptyState } from "@/components/ui/EmptyState";
import { QUERY_HISTORY } from "@/lib/mock-data";
import { DRAFT_SQL_STORAGE_KEY } from "@/lib/utils";

export default function SavedQueriesPage() {
  const router = useRouter();
  const [removedIds, setRemovedIds] = useState<string[]>([]);

  const savedQueries = useMemo(
    () => QUERY_HISTORY.filter((q) => q.isFavorite && !removedIds.includes(q.id)),
    [removedIds]
  );

  function handleRun(sql: string) {
    try {
      sessionStorage.setItem(DRAFT_SQL_STORAGE_KEY, sql);
    } catch {
      // Storage unavailable — Workspace falls back to its default query.
    }
    router.push("/workspace");
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <LoadingReveal skeleton={<PageSkeleton />}>
      <PageHeader
        title="Saved Queries"
        description="Queries you've starred for quick reuse across projects."
      />

      <div className="px-lg md:px-2xl pb-2xl">
        {savedQueries.length === 0 ? (
          <Card>
            <EmptyState
              icon={Bookmark}
              title="Nothing saved yet"
              description="Star a query from Query History or the AI assistant to pin it here for quick access."
              action={
                <Button variant="secondary" onClick={() => router.push("/history")}>
                  Browse Query History
                </Button>
              }
            />
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg items-start">
            {savedQueries.map((query) => (
              <Card key={query.id}>
                <CardBody>
                  <div className="flex items-start justify-between gap-md mb-sm">
                    <div className="flex items-center gap-xs min-w-0">
                      <Bookmark className="h-4 w-4 text-tertiary fill-tertiary shrink-0" aria-hidden="true" />
                      <span className="font-mono text-label-md text-on-surface-variant truncate">
                        {query.database} · {query.timestampLabel}
                      </span>
                    </div>
                    <button
                      type="button"
                      aria-label="Remove from saved"
                      onClick={() => setRemovedIds((prev) => [...prev, query.id])}
                      className="p-1.5 rounded hover:bg-error/10 text-on-surface-variant hover:text-error transition-colors shrink-0"
                    >
                      <Trash2 className="h-[13.5px] w-[13.5px]" aria-hidden="true" />
                    </button>
                  </div>
                  <CodeBlock sql={query.sqlFull} showCopy />
                  <button
                    type="button"
                    onClick={() => handleRun(query.sqlFull)}
                    className="mt-md w-full flex items-center justify-center gap-xs bg-primary text-on-primary py-sm rounded-lg font-label-md hover:brightness-110 active:scale-95 transition-all"
                  >
                    <Play className="h-4 w-4" aria-hidden="true" />
                    Open in Workspace
                  </button>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>
      </LoadingReveal>
    </div>
  );
}
