"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, LayoutTemplate, Play, Star } from "lucide-react";
import { PageHeader } from "@/components/layout/AppShell";
import { Card, CardBody } from "@/components/ui/Card";
import { LoadingReveal } from "@/components/ui/LoadingReveal";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { CodeBlock } from "@/components/sql/CodeBlock";
import { EmptyState } from "@/components/ui/EmptyState";
import { QUERY_TEMPLATES } from "@/lib/mock-data";
import { cn, DRAFT_SQL_STORAGE_KEY } from "@/lib/utils";

const CATEGORIES = ["All", "Revenue", "Growth", "Performance"] as const;

export default function TemplatesPage() {
  const router = useRouter();
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("All");
  const [openId, setOpenId] = useState<string | null>(QUERY_TEMPLATES[0]?.id ?? null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = useMemo(
    () => (category === "All" ? QUERY_TEMPLATES : QUERY_TEMPLATES.filter((t) => t.category === category)),
    [category]
  );

  async function handleCopy(id: string, sql: string) {
    try {
      await navigator.clipboard.writeText(sql);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      // Clipboard unavailable — no-op.
    }
  }

  function handleUseInWorkspace(sql: string) {
    // Workspace reads a starting query from sessionStorage on mount.
    try {
      sessionStorage.setItem(DRAFT_SQL_STORAGE_KEY, sql);
    } catch {
      // Storage unavailable — Workspace will just fall back to its default query.
    }
    router.push("/workspace");
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <LoadingReveal skeleton={<PageSkeleton />}>
      <PageHeader
        title="Templates"
        description="Battle-tested queries for common questions — copy, tweak, and run."
      />

      <div className="px-lg md:px-2xl pb-2xl flex flex-col gap-lg">
        <div className="flex items-center gap-sm flex-wrap">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              aria-pressed={category === c}
              className={cn(
                "px-md py-1.5 rounded-full font-label-md transition-colors border",
                category === c
                  ? "bg-primary-container text-on-primary-container border-primary-container shadow-elevation-1"
                  : "bg-surface-container-lowest border-outline-variant text-on-surface-variant hover:bg-surface-container-low"
              )}
            >
              {c}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <Card>
            <EmptyState
              icon={LayoutTemplate}
              title="No templates in this category yet"
              description="Try a different category, or check back soon — new templates ship regularly."
            />
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg items-start">
            {filtered.map((template) => {
              const isOpen = openId === template.id;
              return (
                <Card key={template.id} className="overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenId(isOpen ? null : template.id)}
                    className="w-full text-left p-md flex items-start justify-between gap-md hover:bg-surface-container-low transition-colors"
                    aria-expanded={isOpen}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-xs mb-1">
                        {template.isFavorite && (
                          <Star className="h-4 w-4 text-tertiary fill-tertiary" aria-hidden="true" />
                        )}
                        <h3 className="font-heading text-headline-sm text-on-surface truncate">
                          {template.title}
                        </h3>
                      </div>
                      <p className="text-body-md text-on-surface-variant">{template.description}</p>
                      <span className="inline-block mt-2 px-2 py-0.5 rounded bg-primary/10 text-primary text-label-sm font-mono uppercase">
                        {template.category}
                      </span>
                    </div>
                  </button>

                  {isOpen && (
                    <CardBody className="pt-0">
                      <CodeBlock sql={template.sql} showCopy={false} />
                      <div className="flex items-center gap-sm mt-md">
                        <button
                          type="button"
                          onClick={() => handleUseInWorkspace(template.sql)}
                          className="flex-1 flex items-center justify-center gap-xs bg-primary text-on-primary py-sm rounded-lg font-label-md hover:brightness-110 active:scale-95 transition-all"
                        >
                          <Play className="h-4 w-4" aria-hidden="true" />
                          Use in Workspace
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopy(template.id, template.sql)}
                          className="flex items-center justify-center gap-xs px-md py-sm border border-outline-variant rounded-lg font-label-md text-on-surface-variant hover:bg-surface-container-low transition-colors"
                        >
                          {copiedId === template.id ? (
                            <Check className="h-4 w-4 text-success" aria-hidden="true" />
                          ) : (
                            <Copy className="h-4 w-4" aria-hidden="true" />
                          )}
                          {copiedId === template.id ? "Copied" : "Copy"}
                        </button>
                      </div>
                    </CardBody>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
      </LoadingReveal>
    </div>
  );
}
