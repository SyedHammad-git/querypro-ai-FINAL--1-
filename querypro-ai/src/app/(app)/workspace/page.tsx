"use client";

import { useEffect, useState } from "react";
import { MessageSquare, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen } from "lucide-react";
import { ConnectionBadge } from "@/components/ui/Chip";
import { IconButton } from "@/components/ui/IconButton";
import { LoadingReveal } from "@/components/ui/LoadingReveal";
import { WorkspaceSkeleton } from "@/components/ui/Skeleton";
import { SchemaTree, getDefaultTable } from "@/components/schema/SchemaTree";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { SqlWorkspaceEditor } from "@/components/sql/SqlWorkspaceEditor";
import { ResultsConsole } from "@/components/sql/ResultsConsole";
import { useSqlStore } from "@/lib/useSqlStore";
import { useToast } from "@/components/ui/Toast";
import { LIVE_SQL_SNIPPET } from "@/lib/mock-data";
import { DRAFT_SQL_STORAGE_KEY } from "@/lib/utils";
import type { SchemaTable } from "@/lib/types";

export default function WorkspacePage() {
  const [schemaVisible, setSchemaVisible] = useState(true);
  const [chatVisible, setChatVisible] = useState(false);
  const [selectedTable, setSelectedTable] = useState<SchemaTable>(getDefaultTable());
  const [sql, setSql] = useState(LIVE_SQL_SNIPPET);
  const [saving, setSaving] = useState(false);

  const { isExecuting, queryResult, initDb, executeSql } = useSqlStore();
  const { showToast } = useToast();

  // Boot PGlite on mount (no-op if already running from another page).
  useEffect(() => {
    initDb();
  }, [initDb]);

  // Pick up a query handed off from Templates or Saved Queries, if any.
  useEffect(() => {
    try {
      const draft = sessionStorage.getItem(DRAFT_SQL_STORAGE_KEY);
      if (draft) {
        setSql(draft);
        sessionStorage.removeItem(DRAFT_SQL_STORAGE_KEY);
      }
    } catch {
      // Storage unavailable — fall back to the default snippet.
    }
  }, []);

  async function runQuery(nextSql?: string) {
    const queryToRun = nextSql ?? sql;
    if (nextSql) setSql(nextSql);
    await executeSql(queryToRun);
  }

  async function handleSaveWorkspace() {
    setSaving(true);
    try {
      const res = await fetch("/api/workspace/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: selectedTable.name ? `${selectedTable.name} Workspace` : "Untitled Workspace",
          data: { sql, selectedTableId: selectedTable.id },
        }),
      });
      const payload = await res.json();
      if (res.ok && payload.success) {
        showToast("Workspace saved successfully to database!", "success");
      } else {
        throw new Error(payload.error || "Failed to save workspace");
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to save workspace", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <LoadingReveal skeleton={<WorkspaceSkeleton />} className="flex-1 flex flex-col min-h-0">
      <div className="h-12 shrink-0 flex items-center justify-between px-lg border-b border-border-subtle bg-surface-container-lowest">
        <div className="flex items-center gap-md min-w-0">
          <IconButton
            aria-label={schemaVisible ? "Hide schema panel" : "Show schema panel"}
            onClick={() => setSchemaVisible((v) => !v)}
          >
            {schemaVisible ? (
              <PanelLeftClose className="h-5 w-5" aria-hidden="true" />
            ) : (
              <PanelLeftOpen className="h-5 w-5" aria-hidden="true" />
            )}
          </IconButton>
          <h1 className="font-heading text-headline-sm text-on-surface truncate">SQL Workspace</h1>
          <span className="hidden lg:inline text-label-sm text-outline">
            Your editor is the star — schema and AI chat tuck away on demand.
          </span>
        </div>
        <div className="flex items-center gap-sm shrink-0">
          <ConnectionBadge />
          <IconButton
            aria-label={chatVisible ? "Hide AI assistant" : "Show AI assistant"}
            active={chatVisible}
            onClick={() => setChatVisible((v) => !v)}
          >
            {chatVisible ? (
              <PanelRightClose className="h-5 w-5" aria-hidden="true" />
            ) : (
              <PanelRightOpen className="h-5 w-5" aria-hidden="true" />
            )}
          </IconButton>
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        {schemaVisible && (
          <SchemaTree selectedTableId={selectedTable.id} onSelectTable={setSelectedTable} />
        )}

        <div className="flex-1 flex flex-col min-h-0 min-w-0">
          <div className="flex-1 flex min-h-0 p-lg gap-lg">
            <SqlWorkspaceEditor
              filename={`${selectedTable.name || "query"}.sql`}
              value={sql}
              onChange={setSql}
              onRun={() => runQuery()}
              onSave={handleSaveWorkspace}
              saving={saving}
              running={isExecuting}
            />

            {chatVisible ? (
              <ChatPanel
                compact
                onRunQuery={(querySql) => runQuery(querySql)}
                className="w-[285px] shrink-0"
              />
            ) : (
              <button
                type="button"
                onClick={() => setChatVisible(true)}
                aria-label="Open AI assistant"
                className="w-12 shrink-0 rounded bg-surface-container-lowest border border-border-subtle hover:bg-surface-container-low transition-colors flex flex-col items-center justify-center gap-sm text-accent-ai"
              >
                <MessageSquare className="h-5 w-5" aria-hidden="true" />
                <span className="[writing-mode:vertical-rl] text-label-sm font-semibold">Ask AI</span>
              </button>
            )}
          </div>

          {/* Always show the results console — it handles null gracefully
              by rendering an empty-state prompt. */}
          <ResultsConsole result={queryResult} />
        </div>
      </div>
    </LoadingReveal>
  );
}
